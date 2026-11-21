import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createApp, API_PREFIX } from "../../../src/app";
import { API_KEY_HEADER } from "../../../src/core/api-keys";
import {
  RESOURCE_NAMES,
  type ResourceName,
} from "../../../src/core/resource-names";
import type { Dataset } from "../../../src/core/store";
import { resources, withDerived } from "../../../src/modules";
import rawData from "../../../src/generated/data.json";

const data = withDerived(rawData as unknown as Dataset);
const app = createApp(data);

const { MODE, DEV, PUBLIC_API_URL } = import.meta.env;

if (!PUBLIC_API_URL) {
  throw new Error(
    `PUBLIC_API_URL is not set for mode "${MODE}". Add it to docs/.env.${MODE}`,
  );
}

if (!DEV && PUBLIC_API_URL.includes("REPLACE_ME")) {
  console.warn(
    `⚠ PUBLIC_API_URL is still a placeholder (${PUBLIC_API_URL}). Update docs/.env.${MODE} before deploying.`,
  );
}

export const IS_LOCAL = DEV;
export const API_URL = PUBLIC_API_URL.replace(/\/+$/, "");

export const API_BASE = `${API_URL}${API_PREFIX}`;

const IMAGES_BASE_URL = (
  import.meta.env.IMAGES_BASE_URL ||
  (readFileSync(join(process.cwd(), "..", "wrangler.toml"), "utf8").match(
    /IMAGES_BASE_URL\s*=\s*"([^"]+)"/,
  )?.[1] ??
    "")
).replace(/\/+$/, "");

if (!DEV && IMAGES_BASE_URL.includes("REPLACE_ME")) {
  console.warn(
    `⚠ IMAGES_BASE_URL is still a placeholder (${IMAGES_BASE_URL}). Update it in wrangler.toml or docs/.env.${MODE} before deploying.`,
  );
}

export { API_KEY_HEADER, API_PREFIX, RESOURCE_NAMES, type ResourceName };

export interface ResourceInfo {
  name: ResourceName;
  title: string;
  description: string;
  example: string;
  count: number;
  filters: { name: string; description: string }[];
  sorts: string[];
}

export function getResource(name: ResourceName): ResourceInfo {
  const def = resources[name];
  return {
    name,
    title: def.title,
    description: def.description,
    example: def.example,
    count: data[name].length,
    filters: Object.entries(def.filters).map(([key, f]) => ({
      name: key,
      description: f.description,
    })),
    sorts: ["id", "name", ...Object.keys(def.sorts)],
  };
}

export const allResources = () =>
  RESOURCE_NAMES.map(getResource).sort((a, b) =>
    a.title.localeCompare(b.title, "en"),
  );

export async function request(path: string) {
  const res = await app.request(`${API_URL}${path}`, {}, { IMAGES_BASE_URL });
  return { status: res.status, body: (await res.json()) as unknown };
}

export function shorten(value: unknown, maxItems = 2): unknown {
  if (Array.isArray(value))
    return value.slice(0, maxItems).map((v) => shorten(v, maxItems));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, shorten(v, maxItems)]),
    );
  }
  return value;
}

export async function example(path: string, maxItems = 2) {
  const { body } = await request(path);
  return JSON.stringify(shorten(body, maxItems), null, 2);
}

const isRef = (v: object) => ["id", "slug", "name", "url"].every((k) => k in v);

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    const inner = value.length ? typeOf(value[0]) : "unknown";
    return inner.includes(" ") ? `(${inner})[]` : `${inner}[]`;
  }
  if (typeof value === "object")
    return isRef(value as object) ? "Reference" : "object";
  return typeof value;
}

export async function fieldTypes(name: ResourceName) {
  const fields = new Map<string, Set<string>>();
  for (const item of data[name]) {
    const { body } = await request(`${API_PREFIX}/${name}/${item.id}`);
    for (const [key, value] of Object.entries(body as object)) {
      if (!fields.has(key)) fields.set(key, new Set());
      fields.get(key)!.add(typeOf(value));
    }
  }
  return [...fields].map(([field, types]) => ({
    field,
    type: [...types]
      .filter((t) => t !== "unknown[]" || types.size === 1)
      .sort((a, b) => (a === "null" ? 1 : b === "null" ? -1 : 0))
      .join(" | "),
  }));
}
