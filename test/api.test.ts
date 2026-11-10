import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { Dataset } from "../src/core/store";

const data = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "..", "src", "generated", "data.json"),
    "utf8",
  ),
) as Dataset;
const app = createApp(data);
const env = { IMAGES_BASE_URL: "https://img.test" };

async function get(path: string) {
  const res = await app.request(`http://api.test${path}`, {}, env);
  return {
    status: res.status,
    headers: res.headers,
    body: (await res.json()) as any,
  };
}

describe("index", () => {
  it("lists resources", async () => {
    const { status, body } = await get("/api/v1");
    expect(status).toBe(200);
    expect(body.characters).toBe("http://api.test/api/v1/characters");
  });
});

describe("paginated list", () => {
  it("paginates with limit/offset and next/previous links", async () => {
    const { body } = await get("/api/v1/characters?limit=5&offset=5");
    expect(body.results).toHaveLength(5);
    expect(body.count).toBe(data.characters.length);
    expect(body.next).toContain("offset=10");
    expect(body.previous).toContain("offset=0");
  });

  it("filters by several fields and comma-separated values", async () => {
    const { body } = await get(
      "/api/v1/characters?element=pyro,hydro&rarity=5&limit=100",
    );
    expect(body.count).toBeGreaterThan(0);
    for (const c of body.results) {
      expect(["pyro", "hydro"]).toContain(c.element.slug);
      expect(c.rarity).toBe(5);
    }
  });

  it("filters are case insensitive", async () => {
    const a = await get("/api/v1/characters?region=Liyue");
    const b = await get("/api/v1/characters?region=liyue");
    expect(a.body.count).toBe(b.body.count);
  });

  it("searches by partial name", async () => {
    const { body } = await get("/api/v1/characters?name=hu");
    expect(body.results.map((c: any) => c.slug)).toContain("hu-tao");
  });

  it('sorts descending with "-" prefix', async () => {
    const { body } = await get("/api/v1/weapons?sort=-rarity&limit=3");
    expect(body.results.every((w: any) => w.rarity === 5)).toBe(true);
  });

  it("rejects unknown parameters and invalid values", async () => {
    expect((await get("/api/v1/characters?elemnt=pyro")).status).toBe(400);
    expect((await get("/api/v1/characters?limit=0")).status).toBe(400);
    expect((await get("/api/v1/characters?limit=101")).status).toBe(400);
    expect((await get("/api/v1/characters?sort=foo")).status).toBe(400);
  });

  it("returns absolute image and reference URLs", async () => {
    const { body } = await get("/api/v1/characters?name=hu-tao");
    const hu = body.results[0];
    expect(hu.icon).toMatch(
      /^https:\/\/img\.test\/characters\/hu-tao\/icon\.(webp|png)$/,
    );
    expect(hu.element.url).toBe("http://api.test/api/v1/elements/pyro");
  });
});

describe("detail", () => {
  it("finds by id", async () => {
    const id = data.characters[0].id;
    const { status, body } = await get(`/api/v1/characters/${id}`);
    expect(status).toBe(200);
    expect(body.id).toBe(id);
  });

  it("finds by name in any format", async () => {
    for (const q of ["hu-tao", "Hu Tao", "hu%20tao", "HU-TAO"]) {
      const { status, body } = await get(`/api/v1/characters/${q}`);
      expect(status).toBe(200);
      expect(body.slug).toBe("hu-tao");
    }
  });

  it("includes reverse relations in elements and weapon types", async () => {
    const { body } = await get("/api/v1/elements/pyro");
    expect(body.characters.some((c: any) => c.slug === "hu-tao")).toBe(true);
    const wt = await get("/api/v1/weapon-types/polearm");
    expect(wt.body.weapons.length).toBeGreaterThan(0);
  });

  it("returns 404 with error format", async () => {
    const { status, body } = await get("/api/v1/characters/does-not-exist");
    expect(status).toBe(404);
    expect(body.error.status).toBe(404);
  });
});

describe("random", () => {
  it("returns an item matching the filters without caching", async () => {
    for (let i = 0; i < 10; i++) {
      const { status, body, headers } = await get(
        "/api/v1/characters/random?element=cryo&rarity=4",
      );
      expect(status).toBe(200);
      expect(body.element.slug).toBe("cryo");
      expect(body.rarity).toBe(4);
      expect(headers.get("cache-control")).toBe("no-store");
    }
  });

  it("returns 404 when no item matches", async () => {
    expect((await get("/api/v1/characters/random?rarity=1")).status).toBe(404);
  });

  it("exists for every resource", async () => {
    for (const r of [
      "elements",
      "regions",
      "weapon-types",
      "weapons",
      "characters",
    ]) {
      expect((await get(`/api/v1/${r}/random`)).status).toBe(200);
    }
  });
});
