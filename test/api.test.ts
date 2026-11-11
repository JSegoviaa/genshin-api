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
      expect(c.rarity.id).toBe(5);
    }
  });

  it("filters rarity by stars or by slug", async () => {
    const a = await get("/api/v1/weapons?rarity=5");
    const b = await get("/api/v1/weapons?rarity=5-star");
    expect(a.body.count).toBeGreaterThan(0);
    expect(a.body.count).toBe(b.body.count);
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
    expect(body.results.every((w: any) => w.rarity.id === 5)).toBe(true);
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

  it("lists rarities and their characters and weapons", async () => {
    const list = await get("/api/v1/rarities");
    expect(list.body.results.map((r: any) => r.stars)).toEqual([1, 2, 3, 4, 5]);
    const { status, body } = await get("/api/v1/rarities/5");
    expect(status).toBe(200);
    expect(body.slug).toBe("5-star");
    expect(body.characters.some((c: any) => c.slug === "hu-tao")).toBe(true);
    expect(body.weapons.length).toBeGreaterThan(0);
  });

  it("resolves versions by number or name and lists their characters", async () => {
    for (const q of ["1.3", "1-3"]) {
      const { status, body } = await get(`/api/v1/versions/${q}`);
      expect(status).toBe(200);
      expect(body.title).toBe("All That Glitters");
      expect(body.characters.some((c: any) => c.slug === "hu-tao")).toBe(true);
    }
    expect((await get("/api/v1/versions/Luna%20I")).body.slug).toBe("luna-i");
  });

  it("lists local specialties by region and links them to characters", async () => {
    const { body } = await get(
      "/api/v1/local-specialties?region=liyue&limit=100",
    );
    expect(body.count).toBeGreaterThan(0);
    expect(body.results.every((l: any) => l.region.slug === "liyue")).toBe(
      true,
    );
    const silk = await get("/api/v1/local-specialties/silk-flower");
    expect(silk.body.characters.some((c: any) => c.slug === "hu-tao")).toBe(
      true,
    );
    const region = await get("/api/v1/regions/liyue");
    expect(
      region.body.localSpecialties.some((l: any) => l.slug === "silk-flower"),
    ).toBe(true);
  });

  it("returns release version and local specialty as references", async () => {
    const { body } = await get("/api/v1/characters/hu-tao");
    expect(body.releaseVersion).toMatchObject({ slug: "1-3", name: "1.3" });
    expect(body.localSpecialty).toMatchObject({
      slug: "silk-flower",
      url: "http://api.test/api/v1/local-specialties/silk-flower",
    });
    const filtered = await get(
      "/api/v1/characters?localSpecialty=silk-flower&releaseVersion=1.3",
    );
    expect(filtered.body.results.map((c: any) => c.slug)).toContain("hu-tao");
  });

  it("returns artifact sets with rarities and typed pieces", async () => {
    const { status, body } = await get(
      "/api/v1/artifact-sets/crimson-witch-of-flames",
    );
    expect(status).toBe(200);
    expect(body.rarities.map((r: any) => r.slug)).toEqual(["4-star", "5-star"]);
    expect(body.pieces).toHaveLength(5);
    expect(body.pieces[0]).toMatchObject({
      type: { slug: "flower-of-life" },
      name: "Witch's Flower of Blaze",
    });
  });

  it("returns artifacts with their set, type, rarities and lore", async () => {
    const { status, body } = await get(
      "/api/v1/artifacts/witchs-flower-of-blaze",
    );
    expect(status).toBe(200);
    expect(body.set).toMatchObject({ slug: "crimson-witch-of-flames" });
    expect(body.type).toMatchObject({ slug: "flower-of-life" });
    expect(body.rarities.map((r: any) => r.id)).toEqual([4, 5]);
    expect(body.description.length).toBeGreaterThan(0);
    expect(body.lore).toContain("\n");
    const set = await get("/api/v1/artifact-sets/crimson-witch-of-flames");
    expect(set.body.pieces[0]).toMatchObject({
      slug: "witchs-flower-of-blaze",
      url: "http://api.test/api/v1/artifacts/witchs-flower-of-blaze",
    });
    const filtered = await get(
      "/api/v1/artifacts?set=crimson-witch-of-flames&type=circlet-of-logos",
    );
    expect(filtered.body.results.map((a: any) => a.slug)).toEqual([
      "witchs-scorching-hat",
    ]);
    const oneStar = await get("/api/v1/artifacts?rarity=1&limit=100");
    const oneStarSets = new Set(
      (data as any)["artifact-sets"]
        .filter((x: any) => x.rarities.includes(1))
        .map((x: any) => x.slug),
    );
    expect(oneStar.body.count).toBeGreaterThan(0);
    for (const a of oneStar.body.results)
      expect(oneStarSets.has(a.set.slug)).toBe(true);
  });

  it("has at most one artifact per type in each set", () => {
    const seen = new Set<string>();
    for (const a of (data as any).artifacts) {
      const key = `${a.set}/${a.type}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("links artifact sets to their release version", async () => {
    const { body } = await get("/api/v1/artifact-sets/obsidian-codex");
    expect(body.releaseVersion).toMatchObject({ slug: "5-0", name: "5.0" });
    const filtered = await get(
      "/api/v1/artifact-sets?releaseVersion=5.0&limit=100",
    );
    expect(filtered.body.results.map((s: any) => s.slug)).toContain(
      "obsidian-codex",
    );
    const version = await get("/api/v1/versions/5.0");
    expect(version.body.artifactSets.map((s: any) => s.slug).sort()).toEqual(
      filtered.body.results.map((s: any) => s.slug).sort(),
    );
  });

  it("filters artifact sets by rarity and piece type", async () => {
    const circlets = await get(
      "/api/v1/artifact-sets?type=circlet-of-logos&limit=100",
    );
    const flowers = await get(
      "/api/v1/artifact-sets?type=flower-of-life&limit=100",
    );
    expect(circlets.body.count).toBeGreaterThan(flowers.body.count);
    const fiveStar = await get("/api/v1/artifact-sets?rarity=5-star&limit=100");
    for (const s of fiveStar.body.results) {
      expect(s.rarities.some((r: any) => r.id === 5)).toBe(true);
    }
    const type = await get("/api/v1/artifact-types/circlet-of-logos");
    expect(type.body.artifactSets.length).toBe(circlets.body.count);
  });

  it("returns stats with their characters and weapons", async () => {
    const { status, body } = await get("/api/v1/stats/crit-rate");
    expect(status).toBe(200);
    expect(body).toMatchObject({ name: "CRIT Rate", category: "advanced" });
    expect(body.description.length).toBeGreaterThan(0);
    expect(body.characters.length).toBeGreaterThan(0);
    expect(body.weapons.length).toBeGreaterThan(0);
    const pyro = await get("/api/v1/stats?element=pyro");
    expect(pyro.body.results.map((s: any) => s.slug).sort()).toEqual([
      "pyro-dmg-bonus",
      "pyro-res",
    ]);
    const hidden = await get("/api/v1/stats?category=hidden&limit=100");
    expect(hidden.body.results.every((s: any) => s.category === "hidden")).toBe(
      true,
    );
  });

  it("links characters and weapons to their stats", async () => {
    const hu = await get("/api/v1/characters/hu-tao");
    expect(hu.body.ascensionStat).toMatchObject({
      slug: "crit-dmg",
      url: "http://api.test/api/v1/stats/crit-dmg",
    });
    const homa = await get("/api/v1/weapons/staff-of-homa");
    expect(homa.body.secondaryStat).toMatchObject({ slug: "crit-dmg" });
    const filtered = await get(
      "/api/v1/characters?ascensionStat=crit-dmg&limit=100",
    );
    expect(filtered.body.results.map((c: any) => c.slug)).toContain("hu-tao");
  });

  it("returns artifact main stats and sub stats", async () => {
    const flower = await get("/api/v1/artifact-types/flower-of-life");
    expect(flower.body.mainStats).toEqual([
      {
        stat: expect.objectContaining({ slug: "hp" }),
        percent: false,
      },
    ]);
    expect(flower.body.subStats).toHaveLength(10);
    const crit = await get("/api/v1/artifact-types?mainStat=crit-rate");
    expect(crit.body.results.map((t: any) => t.slug)).toEqual([
      "circlet-of-logos",
    ]);
    const stat = await get("/api/v1/stats/crit-rate");
    expect(stat.body.artifacts.mainStat.map((t: any) => t.slug)).toEqual([
      "circlet-of-logos",
    ]);
    expect(stat.body.artifacts.subStat).toHaveLength(5);
    const pyro = await get("/api/v1/stats/pyro-dmg-bonus");
    expect(pyro.body.artifacts.mainStat.map((t: any) => t.slug)).toEqual([
      "goblet-of-eonothem",
    ]);
    expect(pyro.body.artifacts.subStat).toEqual([]);
  });

  it("returns enemies with type, family, group and elements", async () => {
    const { status, body } = await get("/api/v1/enemies/ruin-guard");
    expect(status).toBe(200);
    expect(body.type).toMatchObject({ slug: "elite-enemies" });
    expect(body.family).toMatchObject({ slug: "automatons" });
    expect(body.group).toMatchObject({ slug: "humanoid-ruin-machines" });
    expect(body.elements.map((e: any) => e.slug)).toEqual(["physical"]);
    expect(body.releaseVersion).toMatchObject({ name: "1.0" });
    expect(body.description).toContain("humanoid war machine");
    const elites = await get(
      "/api/v1/enemies?family=hilichurls&type=elite-enemies&limit=100",
    );
    expect(elites.body.count).toBeGreaterThan(0);
    for (const e of elites.body.results) {
      expect(e.family.slug).toBe("hilichurls");
      expect(e.type.slug).toBe("elite-enemies");
    }
    const cryo = await get("/api/v1/enemies?element=cryo&limit=100");
    expect(cryo.body.count).toBeGreaterThan(0);
  });

  it("returns enemy resistances and boss regions", async () => {
    const guard = await get("/api/v1/enemies/ruin-guard");
    expect(guard.body.resistances).toHaveLength(8);
    expect(guard.body.resistances[0]).toEqual({
      stat: expect.objectContaining({ slug: "physical-res" }),
      value: 70,
      immune: false,
    });
    const slime = await get("/api/v1/enemies/anemo-slime");
    expect(
      slime.body.resistances.find((r: any) => r.stat.slug === "anemo-res"),
    ).toMatchObject({ value: null, immune: true });
    const andrius = await get("/api/v1/enemies/andrius");
    expect(andrius.body.region).toMatchObject({ slug: "mondstadt" });
    const bosses = await get("/api/v1/enemies?region=mondstadt&limit=100");
    expect(bosses.body.results.map((e: any) => e.slug)).toContain("andrius");
    const region = await get("/api/v1/regions/mondstadt");
    expect(region.body.enemies.map((e: any) => e.slug)).toContain("andrius");
  });

  it("returns items with type, source, group and relations", async () => {
    const { status, body } = await get("/api/v1/items/damaged-mask");
    expect(status).toBe(200);
    expect(body.type).toMatchObject({
      slug: "character-and-weapon-enhancement-materials",
    });
    expect(body.source).toBe("general-enemy-drops");
    expect(body.group).toMatchObject({ slug: "hilichurl-materials" });
    expect(body.rarity).toMatchObject({ id: 1 });
    expect(body.droppedBy.map((e: any) => e.slug)).toContain("hilichurl");
    expect(body.usedBy.characters.length).toBeGreaterThan(0);
    expect(body.usedBy.weapons.length).toBeGreaterThan(0);
    const group = await get("/api/v1/item-groups/hilichurl-materials");
    expect(group.body.items.map((i: any) => i.slug)).toEqual([
      "damaged-mask",
      "stained-mask",
      "ominous-mask",
    ]);
    const weekly = await get(
      "/api/v1/items?source=weekly-boss-drops&rarity=5&limit=100",
    );
    expect(weekly.body.count).toBeGreaterThan(0);
    const type = await get("/api/v1/item-types/character-ascension-materials");
    expect(type.body.inventoryCategory).toBe("Character Development Items");
    expect(type.body.groups).toHaveLength(7);
  });

  it("links enemy drops and character materials to items", async () => {
    const guard = await get("/api/v1/enemies/ruin-guard");
    expect(guard.body.drops.items.map((i: any) => i.slug)).toContain(
      "chaos-core",
    );
    const droppers = await get("/api/v1/enemies?drop=damaged-mask&limit=100");
    expect(droppers.body.results.map((e: any) => e.slug)).toContain(
      "hilichurl",
    );
    const hu = await get("/api/v1/characters/hu-tao");
    expect(hu.body.materials.boss).toMatchObject({ slug: "juvenile-jade" });
    expect(hu.body.materials.common.map((m: any) => m.slug)).toContain(
      "whopperflower-nectar",
    );
    const set = await get("/api/v1/artifact-sets/berserker");
    expect(set.body.droppedBy.length).toBeGreaterThan(0);
  });

  it("links enemy families, groups and types", async () => {
    const family = await get("/api/v1/enemy-families/hilichurls");
    expect(family.body.groups.map((g: any) => g.slug)).toContain("samachurls");
    expect(family.body.enemies.map((e: any) => e.slug)).toContain("hilichurl");
    const group = await get("/api/v1/enemy-groups/samachurls");
    expect(group.body.family).toMatchObject({ slug: "hilichurls" });
    expect(group.body.enemies.length).toBeGreaterThan(0);
    const abyss = await get("/api/v1/enemy-groups?family=the-abyss&limit=100");
    expect(abyss.body.results.map((g: any) => g.slug)).toContain("abyss-mages");
    const weekly = await get("/api/v1/enemy-types/weekly-bosses");
    expect(weekly.body.enemies).toHaveLength(14);
    const version = await get("/api/v1/versions/1.0");
    expect(version.body.enemies.map((e: any) => e.slug)).toContain("hilichurl");
    expect(version.body.items.map((i: any) => i.slug)).toContain(
      "damaged-mask",
    );
  });

  it("returns weapons and local specialties with their release version", async () => {
    const homa = await get("/api/v1/weapons/staff-of-homa");
    expect(homa.body.releaseVersion).toMatchObject({
      slug: "1-3",
      name: "1.3",
    });
    const silk = await get("/api/v1/local-specialties/silk-flower");
    expect(silk.body.releaseVersion).toMatchObject({ name: "1.0" });
    const weapons = await get("/api/v1/weapons?releaseVersion=1.3&limit=100");
    expect(weapons.body.results.map((w: any) => w.slug)).toContain(
      "staff-of-homa",
    );
    const version = await get("/api/v1/versions/1.3");
    expect(version.body.weapons.map((w: any) => w.slug)).toContain(
      "staff-of-homa",
    );
    const first = await get("/api/v1/versions/1.0");
    expect(first.body.localSpecialties.map((l: any) => l.slug)).toContain(
      "silk-flower",
    );
  });

  it("returns weapon ascension materials and weapon materials", async () => {
    const grain = await get("/api/v1/items/grain-of-aerosiderite");
    expect(grain.body.type).toMatchObject({
      slug: "weapon-ascension-materials",
    });
    expect(grain.body.source).toBe("domains-of-forgery");
    expect(grain.body.group).toMatchObject({ slug: "aerosiderite" });
    expect(grain.body.days).toEqual(["wednesday", "saturday", "sunday"]);
    expect(grain.body.usedBy.weapons.map((w: any) => w.slug)).toContain(
      "staff-of-homa",
    );
    const monday = await get("/api/v1/items?days=monday&limit=100");
    expect(monday.body.count).toBeGreaterThan(0);
    const homa = await get("/api/v1/weapons/staff-of-homa");
    expect(homa.body.materials.ascension.map((i: any) => i.slug)).toEqual([
      "grain-of-aerosiderite",
      "piece-of-aerosiderite",
      "bit-of-aerosiderite",
      "chunk-of-aerosiderite",
    ]);
    expect(homa.body.materials.common[0]).toMatchObject({
      slug: "slime-condensate",
    });
    const byGroup = await get(
      "/api/v1/weapons?material=aerosiderite&limit=100",
    );
    expect(byGroup.body.results.map((w: any) => w.slug)).toContain(
      "staff-of-homa",
    );
    const byItem = await get(
      "/api/v1/weapons?material=slime-concentrate&limit=100",
    );
    expect(byItem.body.results.map((w: any) => w.slug)).toContain(
      "staff-of-homa",
    );
  });

  it("returns domains with levels, rewards and bosses", async () => {
    const { status, body } = await get("/api/v1/domains/cecilia-garden");
    expect(status).toBe(200);
    expect(body.type).toMatchObject({ slug: "domains-of-forgery" });
    expect(body.region).toMatchObject({ slug: "mondstadt" });
    expect(body.tiers[0]).toEqual({
      requiredAdventureRank: 15,
      recommendedLevel: 15,
    });
    expect(body.levels).toContainEqual({
      name: "City of Reflections",
      days: ["monday", "thursday", "sunday"],
      group: expect.objectContaining({ slug: "decarabian-tiles" }),
    });
    expect(body.rewards.items.map((i: any) => i.slug)).toContain(
      "tile-of-decarabians-tower",
    );
    const group = await get("/api/v1/item-groups/decarabian-tiles");
    expect(group.body.domain).toMatchObject({ slug: "cecilia-garden" });
    expect(group.body.domainLevel).toBe("City of Reflections");
    const trounce = await get("/api/v1/domains/confront-stormterror");
    expect(trounce.body.enemies.map((e: any) => e.slug)).toEqual([
      "stormterror-dvalin",
    ]);
    const blessing = await get(
      "/api/v1/domains?reward=crimson-witch-of-flames&limit=100",
    );
    expect(blessing.body.count).toBeGreaterThan(0);
    const types = await get("/api/v1/domain-types");
    expect(types.body.count).toBe(6);
  });

  it("adds talent books and links domains back from other resources", async () => {
    const book = await get("/api/v1/items/teachings-of-freedom");
    expect(book.body.type).toMatchObject({
      slug: "character-talent-materials",
    });
    expect(book.body.source).toBe("domains-of-mastery");
    expect(book.body.obtainedFrom.map((d: any) => d.slug)).toEqual([
      "forsaken-rift",
    ]);
    const set = await get("/api/v1/artifact-sets/crimson-witch-of-flames");
    expect(set.body.obtainedFrom.length).toBeGreaterThan(0);
    const dvalin = await get("/api/v1/enemies/stormterror-dvalin");
    expect(dvalin.body.domains.map((d: any) => d.slug)).toEqual([
      "confront-stormterror",
    ]);
    const region = await get("/api/v1/regions/mondstadt");
    expect(region.body.domains.map((d: any) => d.slug)).toContain(
      "cecilia-garden",
    );
  });

  it("returns rarity as a reference", async () => {
    const { body } = await get("/api/v1/characters/hu-tao");
    expect(body.rarity).toMatchObject({
      id: 5,
      slug: "5-star",
      url: "http://api.test/api/v1/rarities/5-star",
    });
    expect(body.rarity.icon).toBe("https://img.test/rarities/5-star.webp");
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
      expect(body.rarity.id).toBe(4);
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
      "rarities",
      "versions",
      "local-specialties",
      "weapons",
      "characters",
      "artifact-types",
      "artifact-sets",
      "artifacts",
      "stats",
      "enemy-types",
      "enemy-families",
      "enemy-groups",
      "enemies",
      "item-types",
      "item-groups",
      "items",
      "domain-types",
      "domains",
    ]) {
      expect((await get(`/api/v1/${r}/random`)).status).toBe(200);
    }
  });
});
