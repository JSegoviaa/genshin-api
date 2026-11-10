import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative } from "node:path";
import type { BaseItem, RefTarget } from "../src/core/resource";
import { RESOURCE_NAMES, type ResourceName } from "../src/core/resource-names";
import { slugify } from "../src/core/slug";
import { resources } from "../src/modules";

const root = join(import.meta.dirname, "..");
const dataDir = join(root, "data");
const outFile = join(root, "src", "generated", "data.json");

const errors: string[] = [];
const fail = (file: string, msg: string) =>
  errors.push(`${relative(root, file)}: ${msg}`);

const loaded = {} as Record<ResourceName, { item: BaseItem; file: string }[]>;

for (const name of RESOURCE_NAMES) {
  const def = resources[name];
  const dir = join(dataDir, name);
  loaded[name] = [];
  if (!existsSync(dir)) continue;

  for (const fileName of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const file = join(dir, fileName);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      fail(file, `Invalid JSON: ${(e as Error).message}`);
      continue;
    }
    const parsed = def.schema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        fail(file, `${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
      continue;
    }
    const { $schema: _, ...item } = parsed.data as BaseItem & {
      $schema?: string;
    };
    if (item.slug !== slugify(item.name)) {
      fail(file, `slug "${item.slug}" should be "${slugify(item.name)}"`);
    }
    if (basename(fileName, ".json") !== item.slug) {
      fail(file, `file should be named ${item.slug}.json`);
    }
    loaded[name].push({ item, file });
  }

  for (const key of ["id", "slug"] as const) {
    const seen = new Map<unknown, string>();
    for (const { item, file } of loaded[name]) {
      const prev = seen.get(item[key]);
      if (prev)
        fail(
          file,
          `duplicated ${key} ${item[key]} (also in ${relative(root, prev)})`,
        );
      else seen.set(item[key], file);
    }
  }
}

const slugsOf = (name: ResourceName) =>
  new Set(loaded[name].map(({ item }) => item.slug));

const keysOf = (name: ResourceName, key: "id" | "slug") =>
  new Set<unknown>(loaded[name].map(({ item }) => item[key]));

for (const name of RESOURCE_NAMES) {
  const refs = Object.entries(resources[name].refs) as [
    string,
    ResourceName | RefTarget,
  ][];
  for (const [field, ref] of refs) {
    const { resource: target, key } =
      typeof ref === "string" ? { resource: ref, key: "slug" as const } : ref;
    const valid = keysOf(target, key);
    for (const { item, file } of loaded[name]) {
      const value = (item as unknown as Record<string, unknown>)[field];
      const values = Array.isArray(value)
        ? value
        : value == null
          ? []
          : [value];
      for (const v of values) {
        if (!valid.has(v))
          fail(file, `${field}: "${v}" does not exist in ${target}`);
      }
    }
  }
  const { example } = resources[name];
  if (!slugsOf(name).has(example)) {
    errors.push(
      `src/modules (${name}): example "${example}" does not exist in data/${name}`,
    );
  }
}

if (errors.length) {
  console.error(`\n✖ ${errors.length} data error(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const output = Object.fromEntries(
  RESOURCE_NAMES.map((name) => [
    name,
    loaded[name].map(({ item }) => item).sort((a, b) => a.id - b.id),
  ]),
);
mkdirSync(join(root, "src", "generated"), { recursive: true });
writeFileSync(outFile, JSON.stringify(output));

const summary = RESOURCE_NAMES.map((n) => `${n}: ${loaded[n].length}`).join(
  ", ",
);
const kb = (Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(0);
console.log(
  `✔ Data is valid (${summary}) → src/generated/data.json (${kb} KB)`,
);
