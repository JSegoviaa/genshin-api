import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { BaseItem, Ctx, Lookup, Ref, ResourceDef } from "./core/resource";
import { RESOURCE_NAMES, type ResourceName } from "./core/resource-names";
import { slugify } from "./core/slug";
import { Store, type Dataset } from "./core/store";
import { resources, withDerived } from "./modules";

export interface Env {
  IMAGES_BASE_URL: string;
}

export const API_PREFIX = "/api/v1";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CACHE = "public, max-age=3600";

const badRequest = (message: string) => new HTTPException(400, { message });
const notFound = (message: string) => new HTTPException(404, { message });

export function createApp(data: Partial<Dataset>) {
  const store = new Store(withDerived(data));
  const app = new Hono<{ Bindings: Env }>();
  const lookup: Lookup = { all: (resource) => store.all(resource) as never };

  function makeCtx(c: Context<{ Bindings: Env }>): Ctx {
    const origin = new URL(c.req.url).origin;
    const imagesBase = (c.env?.IMAGES_BASE_URL ?? "").replace(/\/+$/, "");
    const url = (resource: ResourceName, slug: string) =>
      `${origin}${API_PREFIX}/${resource}/${slug}`;
    const image = (path: string | undefined) =>
      path ? `${imagesBase}/${path}` : null;
    const toRef = (resource: ResourceName, item: BaseItem): Ref => {
      const ref: Ref = {
        id: item.id,
        slug: item.slug,
        name: item.name,
        url: url(resource, item.slug),
      };
      if (item.images && "icon" in item.images)
        ref.icon = image(item.images.icon);
      return ref;
    };
    return {
      ...lookup,
      url,
      image,
      images: (imgs) =>
        Object.fromEntries(Object.entries(imgs).map(([k, v]) => [k, image(v)])),
      ref: (resource, slug) => {
        const item = slug ? store.bySlug(resource, slug) : undefined;
        return item ? toRef(resource, item) : null;
      },
      refById: (resource, id) => {
        const item = id !== null ? store.byId(resource, id) : undefined;
        return item ? toRef(resource, item) : null;
      },
      refByName: (resource, name) => {
        const item = name ? store.bySlug(resource, slugify(name)) : undefined;
        return item ? toRef(resource, item) : null;
      },
      refs: (resource, slugs) =>
        slugs
          .map((s) => store.bySlug(resource, s))
          .filter((i): i is BaseItem => !!i)
          .map((i) => toRef(resource, i)),
      related: (resource, predicate) =>
        store
          .all(resource)
          .filter((i) => predicate(i as never))
          .map((i) => toRef(resource, i)),
    };
  }

  function applyFilters(
    def: ResourceDef,
    query: Record<string, string>,
    extraAllowed: string[],
  ): BaseItem[] {
    const allowed = new Set([
      "name",
      ...Object.keys(def.filters),
      ...extraAllowed,
    ]);
    const unknown = Object.keys(query).filter((k) => !allowed.has(k));
    if (unknown.length) {
      throw badRequest(
        `Invalid query parameter(s): ${unknown.join(", ")}. Allowed: ${[...allowed].join(", ")}`,
      );
    }

    let items = store.all(def.name);
    if (query.name) {
      const needle = slugify(query.name);
      items = items.filter((i) => i.slug.includes(needle));
    }
    for (const [key, filter] of Object.entries(def.filters)) {
      if (query[key] === undefined) continue;
      const wanted = new Set(
        query[key]
          .split(",")
          .map((v) => slugify(v))
          .filter(Boolean),
      );
      items = items.filter((item) => {
        const raw = filter.get(item, lookup);
        const values = Array.isArray(raw) ? raw : [raw];
        return values.some((v) => v !== null && wanted.has(slugify(String(v))));
      });
    }
    return items;
  }

  function parseIntParam(
    value: string | undefined,
    name: string,
    fallback: number,
    min: number,
    max: number,
  ) {
    if (value === undefined) return fallback;
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) {
      throw badRequest(
        `"${name}" must be an integer between ${min} and ${max}`,
      );
    }
    return n;
  }

  app.use("*", cors({ origin: "*", allowMethods: ["GET", "HEAD", "OPTIONS"] }));

  app.get("/", (c) => c.redirect(API_PREFIX));

  app.get(API_PREFIX, (c) => {
    const origin = new URL(c.req.url).origin;
    c.header("Cache-Control", CACHE);
    return c.json(
      Object.fromEntries(
        RESOURCE_NAMES.map((n) => [n, `${origin}${API_PREFIX}/${n}`]),
      ),
    );
  });

  for (const name of RESOURCE_NAMES) {
    const def = resources[name];
    const base = `${API_PREFIX}/${name}`;
    const sorts: Record<string, (i: BaseItem) => string | number> = {
      id: (i) => i.id,
      name: (i) => i.name,
      ...def.sorts,
    };

    app.get(base, (c) => {
      const query = c.req.query();
      const limit = parseIntParam(
        query.limit,
        "limit",
        DEFAULT_LIMIT,
        1,
        MAX_LIMIT,
      );
      const offset = parseIntParam(
        query.offset,
        "offset",
        0,
        0,
        Number.MAX_SAFE_INTEGER,
      );
      const sortParam = query.sort ?? "id";
      const desc = sortParam.startsWith("-");
      const sortKey = desc ? sortParam.slice(1) : sortParam;
      const sortBy = sorts[sortKey];
      if (!sortBy)
        throw badRequest(
          `"sort" must be one of: ${Object.keys(sorts).join(", ")} (prefix with "-" for descending)`,
        );

      const items = [
        ...applyFilters(def, query, ["limit", "offset", "sort"]),
      ].sort((a, b) => {
        const va = sortBy(a);
        const vb = sortBy(b);
        const cmp = va < vb ? -1 : va > vb ? 1 : a.id - b.id;
        return desc ? -cmp : cmp;
      });

      const ctx = makeCtx(c);
      const pageUrl = (newOffset: number) => {
        const u = new URL(c.req.url);
        u.searchParams.set("limit", String(limit));
        u.searchParams.set("offset", String(newOffset));
        return u.toString();
      };

      c.header("Cache-Control", CACHE);
      return c.json({
        count: items.length,
        next: offset + limit < items.length ? pageUrl(offset + limit) : null,
        previous: offset > 0 ? pageUrl(Math.max(0, offset - limit)) : null,
        results: items
          .slice(offset, offset + limit)
          .map((i) => def.summary(i, ctx)),
      });
    });

    app.get(`${base}/random`, (c) => {
      const items = applyFilters(def, c.req.query(), []);
      if (!items.length) throw notFound(`No ${name} match the given filters`);
      const item = items[Math.floor(Math.random() * items.length)];
      c.header("Cache-Control", "no-store");
      return c.json(def.detail(item, makeCtx(c)));
    });

    app.get(`${base}/:idOrName`, (c) => {
      const param = c.req.param("idOrName");
      const item = /^\d+$/.test(param)
        ? store.byId(name, Number(param))
        : store.bySlug(name, slugify(param));
      if (!item) throw notFound(`${name}/${param} not found`);
      c.header("Cache-Control", CACHE);
      return c.json(def.detail(item, makeCtx(c)));
    });
  }

  app.notFound((c) =>
    c.json(
      { error: { status: 404, message: `Route not found: ${c.req.path}` } },
      404,
    ),
  );

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json(
        { error: { status: err.status, message: err.message } },
        err.status,
      );
    }
    console.error(err);
    return c.json(
      { error: { status: 500, message: "Internal server error" } },
      500,
    );
  });

  return app;
}
