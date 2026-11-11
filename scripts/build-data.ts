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
import { isDerived, resources } from "../src/modules";
import type { Dataset } from "../src/core/store";

const root = join(import.meta.dirname, "..");
const dataDir = join(root, "data");
const outFile = join(root, "src", "generated", "data.json");

const errors: string[] = [];
const fail = (file: string, msg: string) =>
  errors.push(`${relative(root, file)}: ${msg}`);

const loaded = {} as Record<ResourceName, { item: BaseItem; file: string }[]>;

function checkUnique(name: ResourceName) {
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

for (const name of RESOURCE_NAMES) {
  const def = resources[name];
  const dir = join(dataDir, name);
  loaded[name] = [];
  if (def.derive) {
    if (existsSync(dir))
      fail(dir, `${name} is derived from other resources and must not have a data folder`);
    continue;
  }
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

  checkUnique(name);
}

const source = Object.fromEntries(
  RESOURCE_NAMES.map((n) => [n, loaded[n].map(({ item }) => item)]),
) as Dataset;
for (const name of RESOURCE_NAMES.filter(isDerived)) {
  const origin = join(dataDir, "(derived)", name);
  for (const raw of resources[name].derive!(source)) {
    const parsed = resources[name].schema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        fail(origin, `${raw.slug}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      continue;
    }
    if (raw.slug !== slugify(raw.name))
      fail(origin, `slug "${raw.slug}" should be "${slugify(raw.name)}"`);
    loaded[name].push({ item: raw, file: `${origin}/${raw.slug}` });
  }
  checkUnique(name);
}

const slugsOf = (name: ResourceName) =>
  new Set(loaded[name].map(({ item }) => item.slug));

const keysOf = (name: ResourceName, key: "id" | "slug") =>
  new Set<unknown>(loaded[name].map(({ item }) => item[key]));

const normalize = (value: unknown, key: RefTarget["key"]) =>
  key === "name" && typeof value === "string" ? slugify(value) : value;

function valuesAt(node: unknown, path: string[]): unknown[] {
  if (node == null) return [];
  if (Array.isArray(node)) return node.flatMap((n) => valuesAt(n, path));
  if (!path.length) return [node];
  const [head, ...rest] = path;
  return valuesAt((node as Record<string, unknown>)[head], rest);
}

for (const name of RESOURCE_NAMES) {
  const refs = Object.entries(resources[name].refs) as [
    string,
    ResourceName | RefTarget,
  ][];
  for (const [field, ref] of refs) {
    const { resource: target, key } =
      typeof ref === "string" ? { resource: ref, key: "slug" as const } : ref;
    const valid = keysOf(target, key === "id" ? "id" : "slug");
    for (const { item, file } of loaded[name]) {
      for (const v of valuesAt(item, field.split("."))) {
        if (!valid.has(normalize(v, key)))
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
  RESOURCE_NAMES.filter((name) => !isDerived(name)).map((name) => [
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
