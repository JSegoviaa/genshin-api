import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";
import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const root = join(import.meta.dirname, "..");
const assetsDir = join(root, "assets");
const dataDir = join(root, "data");
const [command, ...flags] = process.argv.slice(2);

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function referencedImages(): Map<string, string> {
  const refs = new Map<string, string>();
  const visit = (node: unknown, file: string, inImages = false) => {
    if (Array.isArray(node)) node.forEach((n) => visit(n, file));
    else if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node))
        visit(v, file, inImages || k === "images");
    } else if (inImages && typeof node === "string") refs.set(node, file);
  };
  for (const file of walk(dataDir).filter((f) => f.endsWith(".json"))) {
    visit(JSON.parse(readFileSync(file, "utf8")), relative(root, file));
  }
  return refs;
}

const toKey = (file: string) => relative(assetsDir, file).split(sep).join("/");

function check() {
  const refs = referencedImages();
  const files = new Set(walk(assetsDir).map(toKey));
  const missing = [...refs].filter(([path]) => !files.has(path));
  const unused = [...files].filter((f) => !refs.has(f));

  console.log(`Referenced images: ${refs.size} · in assets/: ${files.size}`);
  if (missing.length) {
    console.log(
      `\n✖ ${missing.length} referenced image(s) missing in assets/:`,
    );
    for (const [path, file] of missing) console.log(`  - ${path}  (${file})`);
  }
  if (unused.length) {
    console.log(`\n⚠ ${unused.length} unused file(s) in assets/:`);
    for (const f of unused) console.log(`  - ${f}`);
  }
  if (!missing.length && !unused.length) console.log("✔ All good");
  return missing.length === 0;
}

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

async function sync() {
  const dryRun = flags.includes("--dry-run");
  if (existsSync(join(root, ".env"))) process.loadEnvFile(join(root, ".env"));
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
    process.env;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET
  ) {
    console.error(
      "Missing .env variables: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (see .env.example)",
    );
    process.exit(1);
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const remote = new Map<string, string>();
  let token: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET, ContinuationToken: token }),
    );
    for (const o of page.Contents ?? [])
      remote.set(o.Key!, (o.ETag ?? "").replaceAll('"', ""));
    token = page.NextContinuationToken;
  } while (token);

  const pending = walk(assetsDir).filter((file) => {
    const md5 = createHash("md5").update(readFileSync(file)).digest("hex");
    return remote.get(toKey(file)) !== md5;
  });

  console.log(
    `In R2: ${remote.size} · to upload: ${pending.length}${dryRun ? " (dry-run)" : ""}`,
  );
  if (dryRun) {
    for (const f of pending) console.log(`  - ${toKey(f)}`);
    return;
  }

  let done = 0;
  const queue = [...pending];
  const worker = async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: toKey(file),
          Body: readFileSync(file),
          ContentType:
            CONTENT_TYPES[extname(file).toLowerCase()] ??
            "application/octet-stream",
          CacheControl: "public, max-age=86400",
        }),
      );
      if (++done % 100 === 0 || done === pending.length)
        console.log(`  ${done}/${pending.length}`);
    }
  };
  await Promise.all(Array.from({ length: 16 }, worker));
  console.log("✔ Sync completed");
}

if (command === "check") {
  process.exit(check() ? 0 : 1);
} else if (command === "sync") {
  await sync();
} else {
  console.error("Usage: tsx scripts/images.ts <check|sync> [--dry-run]");
  process.exit(1);
}
