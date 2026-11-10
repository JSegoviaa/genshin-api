# Genshin API v2

Read-only (GET) Genshin Impact API. No database: data lives as JSON files in `data/`, validated at build
time and bundled into a Cloudflare Worker. Images are served from Cloudflare R2.

Cost: $0 within the free tiers (Workers: 100k requests/day; R2: 10 GB, no egress fees).

## Structure

```
data/<resource>/<slug>.json   ← the data (the only thing you usually edit)
assets/                       ← local images, same paths as in R2 (not in git)
schemas/                      ← generated JSON Schema (VS Code autocomplete)
src/schemas.ts                ← Zod schemas: shape of each resource
src/resources.ts              ← filters, sorting and response shape of each resource
src/app.ts                    ← routes (Hono)
scripts/                      ← data build, images and v1 migration
```

## Endpoints

Base: `/api/v2`. Resources: `elements`, `regions`, `weapon-types`, `weapons`, `characters`.

| Endpoint | Description |
|---|---|
| `GET /api/v2/<resource>` | Paginated list |
| `GET /api/v2/<resource>/random` | Random item (accepts the same filters) |
| `GET /api/v2/<resource>/<id or name>` | Detail by id (`31`) or name (`hu-tao`, `Hu Tao`) |

List parameters:

- `limit` (1-100, default 20) and `offset`
- `sort`: `id`, `name` and resource-specific fields; prefix with `-` for descending (`sort=-releaseDate`)
- `name`: partial search (`name=hu`)
- Resource filters, accepting comma-separated values:
  - `characters`: `rarity`, `element`, `weaponType`, `region`, `gender`, `bodyType`, `releaseVersion`
  - `weapons`: `rarity`, `weaponType`, `secondaryStat`, `series`

Examples:

```
/api/v2/characters?element=pyro,hydro&rarity=5&sort=-releaseDate
/api/v2/characters/random?region=liyue
/api/v2/weapons?weaponType=bow&rarity=5
/api/v2/elements/pyro
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

References to exposed resources are stored by slug (`"element": "pyro"`). Fields pointing to resources not yet
exposed by the API (stats, materials, local specialties, weapon series) are stored by name
(`"ascensionStat": "CRIT DMG"`). Once those resources exist, they will be resolved with `slugify(name)`
without touching the data.

### Adding a new resource (e.g. enemies)

1. Zod schema in `src/schemas.ts`.
2. Name in `RESOURCE_NAMES` and definition (filters, sorts, `summary`/`detail`) in `src/resources.ts`.
3. Files in `data/enemies/`. The 3 endpoints are generated automatically.
4. `npm run schemas` to regenerate the JSON Schema.

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

## v1 migration

`npm run migrate:v1 -- --force` regenerates `data/` and `assets/` from `../genshin-api` and `../gi-api`
(read only). It has already been run once; **do not run it again** after editing data by hand, since `--force` overwrites it.
