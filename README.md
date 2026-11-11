# Genshin API

Read-only (GET) Genshin Impact API. No database: data lives as JSON files in `data/`, validated at build
time and bundled into a Cloudflare Worker. Images are served from Cloudflare R2.

Cost: $0 within the free tiers (Workers: 100k requests/day; R2: 10 GB, no egress fees).

## Structure

```
data/<resource>/<slug>.json   ← the data (the only thing you usually edit)
assets/                       ← local images, same paths as in R2 (not in git)
schemas/                      ← generated JSON Schema (VS Code autocomplete)
src/core/                     ← shared code: resource types, Zod primitives, store, slugify
src/modules/<resource>/
  <name>.schema.ts            ← Zod schema: shape of the JSON files
  <name>.resource.ts          ← filters, sorting and response shape
src/modules/index.ts          ← module registry
src/app.ts                    ← generic routes (Hono)
scripts/                      ← data build, JSON schemas and images
```

## Endpoints

Base: `/api/v1`. Resources: `elements`, `regions`, `weapon-types`, `rarities`, `versions`, `local-specialties`, `weapons`, `characters`, `artifact-types`, `artifact-sets`, `artifacts`, `stats`, `enemy-types`, `enemy-families`, `enemy-groups`, `enemies`, `item-types`, `item-groups`, `items`.

| Endpoint | Description |
|---|---|
| `GET /api/v1/<resource>` | Paginated list |
| `GET /api/v1/<resource>/random` | Random item (accepts the same filters) |
| `GET /api/v1/<resource>/<id or name>` | Detail by id (`31`) or name (`hu-tao`, `Hu Tao`) |

List parameters:

- `limit` (1-100, default 20) and `offset`
- `sort`: `id`, `name` and resource-specific fields; prefix with `-` for descending (`sort=-releaseDate`)
- `name`: partial search (`name=hu`)
- Resource filters, accepting comma-separated values:
  - `characters`: `rarity`, `element`, `weaponType`, `region`, `gender`, `bodyType`, `releaseVersion`, `localSpecialty`, `ascensionStat`
  - `local-specialties`: `region`, `releaseVersion`
  - `artifact-sets`: `rarity`, `type` (piece type, e.g. `circlet-of-logos`), `releaseVersion`
  - `weapons`: `rarity`, `weaponType`, `secondaryStat`, `series`, `material` (item or item group slug), `releaseVersion`
  - `artifacts`: `set`, `type`, `rarity` (from the set)
  - `artifact-types`: `mainStat` (e.g. `crit-rate`)
  - `enemies`: `type`, `family`, `group`, `region` (bosses only), `element`, `drop` (item or artifact set slug), `releaseVersion`
  - `items`: `type`, `source` (`general-enemy-drops`, `elite-enemy-drops`, `normal-boss-drops`, `weekly-boss-drops`, `ascension-gems`, `domains-of-forgery`), `group`, `rarity`, `releaseVersion`, `days` (e.g. `monday`)
  - `item-groups`: `type`, `source`
  - `enemy-groups`: `family`
  - `stats`: `category` (`basic`, `advanced`, `hidden`), `element`
  - `rarity` accepts the number of stars or the rarity slug (`rarity=5` or `rarity=5-star`)

Examples:

```
/api/v1/characters?element=pyro,hydro&rarity=5&sort=-releaseDate
/api/v1/characters/random?region=liyue
/api/v1/weapons?weaponType=bow&rarity=5
/api/v1/elements/pyro
```

List format: `{ count, next, previous, results }`. Errors: `{ error: { status, message } }`.
Unknown query parameters return 400.

## Development

```bash
npm install
npm run dev            # validates data/ and runs the Worker locally (http://localhost:8787)
npm test
npm run typecheck
```

## Adding or editing data

1. Create `data/characters/<slug>.json`. The `slug` is the lowercase, hyphenated name
   (`"Hu Tao"` → `hu-tao`) and the file must have the same name. Use the next free `id`.
   Thanks to `"$schema"`, VS Code autocompletes fields and highlights errors.
2. Copy the images to `assets/` using the paths set in `images` (e.g. `assets/characters/hu-tao/icon.webp`).
3. `npm run build:data` validates everything: schema, unique ids/slugs and references (`"element": "pyro"` must exist).
4. `npm run images:check` verifies no images are missing.
5. `npm run images:sync` uploads new images to R2 and `npm run deploy` publishes the API.

References to exposed resources are stored by slug (`"element": "pyro"`), except `rarity`, which is
stored as the number of stars (`"rarity": 5`) and returned as a reference to `rarities`. Some fields
are stored by name and resolved with `slugify(name)`: `releaseVersion` (in every released resource), `localSpecialty`,
`ascensionStat` and `secondaryStat` (`"ascensionStat": "CRIT DMG"` → `stats/crit-dmg`). Character
`materials` are also stored by name and resolved against `items`. Fields
pointing to resources not yet exposed by the API (weapon series) are also stored by name
and will be resolved the same way once those resources exist, without touching the data.

### Adding a new resource (e.g. enemies)

1. Create `src/modules/enemies/enemy.schema.ts` (Zod schema, using the primitives in `src/core/schema.ts`).
2. Create `src/modules/enemies/enemy.resource.ts` with `defineResource` (filters, sorts, `summary`/`detail`).
3. Add `"enemies"` to `src/core/resource-names.ts` and register the module in `src/modules/index.ts`.
4. Add files in `data/enemies/`. The 3 endpoints are generated automatically.
5. `npm run schemas` to regenerate the JSON Schema.

## Deployment (one time)

1. Create a free Cloudflare account and run `npx wrangler login`.
2. **R2**: enable R2 in the dashboard (it may ask for a payment method even on the free tier)
   and create the `genshin-images` bucket.
   - Settings → Public access → enable the `r2.dev` subdomain and set its URL as `IMAGES_BASE_URL` in `wrangler.toml`.
   - Manage API tokens → create a token with *Object Read & Write* and fill in `.env` (see `.env.example`).
3. `npm run images:sync` (first run uploads everything; afterwards only new or changed files).
4. `npm run deploy` → the API is available at `https://genshin-api.<your-subdomain>.workers.dev`.

> The `r2.dev` subdomain is rate limited and Cloudflare recommends it for development only.
> Once you have a domain, connect it to the bucket (R2 → Settings → Custom domains) and update `IMAGES_BASE_URL`.
> Image URLs are built from that variable, so the data does not change.

## Documentation site

`docs/` is a static Astro site deployed as its own Cloudflare Worker (static assets only, free and
unlimited). Resource pages, filter tables, field types and response examples are generated at build
time from `src/modules` and the real data, so they never drift from the API. Each module's `title`,
`description` and `example` (a slug that must exist in `data/`) feed the docs.

```bash
cd docs
npm install
npm run dev            # http://localhost:4321
npm run build          # rebuilds data and generates docs/dist
npm run deploy         # build + wrangler deploy (Worker "genshin-api-docs")
```

### Environments

The API URL used in examples and "Try it" boxes is `PUBLIC_API_URL`, picked by mode:

| Command | Mode | File | API URL |
|---|---|---|---|
| `npm run dev` | development | `docs/.env.development` | `http://localhost:8787` |
| `npm run build` / `deploy` | production | `docs/.env.production` | public API URL |

In development a "Local" badge in the header shows which API the docs are using. To test locally,
run `npm run dev` in the project root (API) and in `docs/` (docs) at the same time.

Update `docs/.env.production` with the real API URL before deploying; the build warns while it is a
placeholder. For personal overrides use `docs/.env.development.local` (ignored by git).

## Data sources

Part of the data comes from the [Genshin Impact Wiki](https://genshin-impact.fandom.com/) on Fandom,
available under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The docs footer
includes the attribution.
