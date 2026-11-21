# Genshin API

Read-only Genshin Impact API. Data lives as JSON files in `data/`, validated at build time and
bundled into a Cloudflare Worker. Images are served from Cloudflare R2. Requests require an API key,
stored hashed in Cloudflare D1.

Cost: $0 within the free tiers (Workers: 100k requests/day; R2: 10 GB, no egress fees; D1: 5M reads/day).

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
src/core/api-keys.ts          ← API key generation, hashing and D1 store
src/app.ts                    ← generic routes (Hono) and API key auth
migrations/                   ← D1 migrations
scripts/                      ← data build, JSON schemas and images
```

## Endpoints

Base: `/api/v1`. Resources: `elements`, `regions`, `weapon-types`, `rarities`, `versions`, `weapons`, `characters`, `constellations`, `artifact-types`, `artifact-sets`, `artifacts`, `stats`, `enemy-types`, `enemy-families`, `enemy-groups`, `enemies`, `item-types`, `item-groups`, `items`, `domain-types`, `domains`.

| Endpoint | Description |
|---|---|
| `POST /api/v1/keys` | Create an API key (no key needed, Turnstile token required). Body: `{ "name": "My app", "turnstileToken": "..." }` |
| `DELETE /api/v1/keys` | Revoke the API key sent in the header |
| `GET /api/v1/<resource>` | Paginated list |
| `GET /api/v1/<resource>/random` | Random item (accepts the same filters) |
| `GET /api/v1/<resource>/<id or name>` | Detail by id (`31`) or name (`hu-tao`, `Hu Tao`) |

### API keys

Every endpoint except `POST /api/v1/keys` requires an API key in the `X-API-Key` header; missing,
invalid or revoked keys return 401. Keys have the form `gsk_<43 base64url chars>` (32 random bytes)
and are returned only once, on creation. D1 stores only their SHA-256 hash, a short `prefix` to identify
them and an optional `name`. Each Worker isolate caches successful checks for 60 seconds, so a revoked
key may keep working for up to a minute.

Keys are created from the docs Authentication page, which renders a
[Turnstile](https://developers.cloudflare.com/turnstile/) widget and sends its token as `turnstileToken`.
The Worker validates it with Cloudflare (`TURNSTILE_SECRET_KEY`) and answers 403 when it is missing or
invalid, so scripts cannot create keys in bulk.

```bash
curl -H "X-API-Key: gsk_..." https://<api>/api/v1/characters/hu-tao
curl -X DELETE -H "X-API-Key: gsk_..." https://<api>/api/v1/keys
```

To revoke a key you do not own (e.g. abuse), find it by the prefix it was returned with:

```bash
npx wrangler d1 execute DB --remote --command   "UPDATE api_keys SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE prefix = 'gsk_xxxxxxxx'"
```

Add `--env develop` for the develop database.

List parameters:

- `limit` (1-100, default 20) and `offset`
- `sort`: `id`, `name` and resource-specific fields; prefix with `-` for descending (`sort=-releaseDate`)
- `name`: partial search (`name=hu`)
- Resource filters, accepting comma-separated values:
  - `constellations`: `character`, `element`, `region`, `releaseVersion`
  - `characters`: `rarity`, `element`, `weaponType`, `region`, `gender`, `bodyType`, `releaseVersion`, `localSpecialty`, `ascensionStat`, `material`
  - `artifact-sets`: `rarity`, `type` (piece type, e.g. `circlet-of-logos`), `releaseVersion`
  - `weapons`: `rarity`, `weaponType`, `secondaryStat`, `series`, `material` (item or item group slug), `releaseVersion`
  - `artifacts`: `set`, `type`, `rarity` (from the set)
  - `artifact-types`: `mainStat` (e.g. `crit-rate`)
  - `enemies`: `type`, `family`, `group`, `region` (bosses only), `element`, `drop` (item or artifact set slug), `releaseVersion`
  - `items`: `type`, `source` (`general-enemy-drops`, `elite-enemy-drops`, `normal-boss-drops`, `weekly-boss-drops`, `boss-drops`, `domains-of-mastery`, `domains-of-forgery`, `gathering`), `group`, `region`, `rarity`, `releaseVersion`, `days` (e.g. `monday`)
  - `item-groups`: `type`, `source`, `domain`
  - `domains`: `type`, `region`, `element` (recommended), `reward` (item or artifact set slug), `releaseVersion`
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
npm run dev            # validates data/, applies D1 migrations locally and runs the Worker (http://localhost:8787)
npm test
npm run typecheck
```

Locally, `.dev.vars` and `docs/.env.development` use Cloudflare's Turnstile test keys, which always pass
(copy `TURNSTILE_SECRET_KEY` from `.dev.vars.example`). Create a key from the docs Authentication page, or
with `curl -X POST http://localhost:8787/api/v1/keys -d '{"turnstileToken":"test"}'`. The local D1 database lives in `.wrangler/`. New migrations go in `migrations/`
(`npx wrangler d1 migrations create DB <name>`) and are applied by `npm run dev` locally, and remotely
before every deployment (by the deploy workflow and by `npm run deploy`). `npm run db:migrate` applies
them to the production database without deploying.

## Adding or editing data

1. Create `data/characters/<slug>.json`. The `slug` is the lowercase, hyphenated name
   (`"Hu Tao"` → `hu-tao`) and the file must have the same name. Use the next free `id`.
   Thanks to `"$schema"`, VS Code autocompletes fields and highlights errors.
2. Copy the images to `assets/` using the paths set in `images` (e.g. `assets/characters/hu-tao/icon.webp`).
3. `npm run build:data` validates everything: schema, unique ids/slugs and references (`"element": "pyro"` must exist).
4. `npm run images:check` verifies no images are missing.
5. `npm run images:sync:local` to preview them locally (see [Local images](#local-images)), then
   `npm run images:sync` uploads new images to R2 and pushing to `main` publishes the API (see [Deployment](#deployment)).

References to exposed resources are stored by slug (`"element": "pyro"`, `"ascensionStat": "crit-dmg"`,
`"materials": { "localSpecialty": "silk-flower" }`), except `rarity`, which is stored as the number of stars
(`"rarity": 5`, or `null` for items without rarity such as local specialties) and returned as a reference
to `rarities`. `releaseVersion` is stored by version name (`"1.3"`, `"Luna I"`) and resolved with
`slugify(name)`. Fields pointing to resources not yet exposed by the API (weapon series) are stored by
name and will be resolved the same way once those resources exist, without touching the data.

Some resources are derived instead of stored: `constellations` are kept inside each character file
(`constellations[]`, with their own `id` and `releaseVersion`) and the API builds the resource from them
(`derive` in the resource definition), so they have no `data/` folder.

Data that can be derived is not stored twice: item groups take their type and source from their items,
and Forgery and Mastery domains take their item rewards from the item groups linked to them.

### Adding a new resource (e.g. enemies)

1. Create `src/modules/enemies/enemy.schema.ts` (Zod schema, using the primitives in `src/core/schema.ts`).
2. Create `src/modules/enemies/enemy.resource.ts` with `defineResource` (filters, sorts, `summary`/`detail`).
3. Add `"enemies"` to `src/core/resource-names.ts` and register the module in `src/modules/index.ts`.
4. Add files in `data/enemies/`. The 3 endpoints are generated automatically.
5. `npm run schemas` to regenerate the JSON Schema.

## Local images

`docker-compose.yml` runs [RustFS](https://rustfs.com), an S3-compatible server, so images can be tested
locally without touching R2:

```bash
docker compose up -d              # S3 API on http://localhost:9100, console on http://localhost:9101
npm run images:sync:local         # creates the bucket, makes it public-read and uploads assets/
cp .dev.vars.example .dev.vars    # IMAGES_BASE_URL=http://localhost:9100/genshin-images
npm run dev                       # the API now returns local image URLs
```

`images:sync:local` uploads only new or changed files, like `images:sync`. Ports, credentials and bucket
name can be changed with the `LOCAL_S3_*` variables in `.env` (see `.env.example`); the console login is
`LOCAL_S3_ACCESS_KEY_ID` / `LOCAL_S3_SECRET_ACCESS_KEY` (`genshin` / `genshin-local-secret` by default).
`docker compose down -v` removes the container and its data. Production is unaffected: `images:sync` always
uses the R2 credentials, and the deployed Worker uses `IMAGES_BASE_URL` from `wrangler.toml`.

## Deployment

Deployments run in GitHub Actions (`.github/workflows/deploy.yml`) on every push. Each push typechecks,
tests, builds the docs, applies the D1 migrations and deploys both Workers to the environment of its branch:

| Branch | Environment | API Worker | Docs Worker | Docs API URL |
|---|---|---|---|---|
| `main` | production | `genshin-api` | `genshin-api-docs` | `docs/.env.production` |
| `develop` | develop | `genshin-api-develop` | `genshin-api-docs-develop` | `docs/.env.develop` |

The `develop` environment is declared as `[env.develop]` in `wrangler.toml` and `docs/wrangler.toml`
(its `IMAGES_BASE_URL` lives in `[env.develop.vars]`). The workflow can also be run manually from the
Actions tab.

### One-time setup

1. Create a free Cloudflare account.
2. **R2**: enable R2 in the dashboard (it may ask for a payment method even on the free tier)
   and create the `genshin-images` bucket.
   - Settings → Public access → enable the `r2.dev` subdomain and set its URL as `IMAGES_BASE_URL` in
     `wrangler.toml` (both in `[vars]` and `[env.develop.vars]`).
   - Manage API tokens → create a token with *Object Read & Write* and fill in `.env` (see `.env.example`).
3. `npm run images:sync` (first run uploads everything; afterwards only new or changed files).
4. **D1**: `npx wrangler d1 create genshin-api` and `npx wrangler d1 create genshin-api-develop`, and put
   each returned `database_id` in `wrangler.toml` (`[[d1_databases]]` and `[[env.develop.d1_databases]]`).
   The deploy workflow applies the migrations; the API token needs *D1 Edit* permission.
5. **Turnstile**: Turnstile → Add widget, with the production and develop docs hostnames (or one widget
   per environment). Put the site key in `PUBLIC_TURNSTILE_SITE_KEY` in `docs/.env.production` and
   `docs/.env.develop`, and add the secret key as the `TURNSTILE_SECRET_KEY` secret of the `production` and
   `develop` GitHub environments. The deploy workflow uploads it to the Worker on every deployment.
6. Cloudflare → My Profile → API Tokens → create a token from the *Edit Cloudflare Workers* template.
7. GitHub → Settings → Secrets and variables → Actions → add `CLOUDFLARE_API_TOKEN` (the token) and
   `CLOUDFLARE_ACCOUNT_ID` (shown in the Workers & Pages overview).
8. Push to `main` and `develop`. The APIs are available at `https://genshin-api.<your-subdomain>.workers.dev`
   and `https://genshin-api-develop.<your-subdomain>.workers.dev`; put those URLs in `docs/.env.production`
   and `docs/.env.develop`.

Images are not deployed by the workflow: run `npm run images:sync` after adding new images.

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
npm run build          # rebuilds data and generates docs/dist (production URLs)
npm run build:local    # same build with the development URLs (local API and images)
npm run preview:local  # build:local + serve docs/dist
```

### Environments

The API URL used in examples and "Try it" boxes is `PUBLIC_API_URL`, picked by mode:

| Command | Mode | File | API URL | Image URL (`IMAGES_BASE_URL`) |
|---|---|---|---|---|
| `npm run dev` | development | `docs/.env.development` | `http://localhost:8787` | `http://localhost:9100/genshin-images` |
| `npm run build` | production | `docs/.env.production` | public API URL | from `wrangler.toml` unless set |
| `npm run build -- --mode develop` | develop | `docs/.env.develop` | develop API URL | from `wrangler.toml` unless set |

The API follows the same rule: `wrangler dev` reads `IMAGES_BASE_URL` from `.dev.vars` and the deployed
Worker from `wrangler.toml`. Restart the dev servers after changing these files.

In development a "Local" badge in the header shows which API the docs are using. To test locally,
run `npm run dev` in the project root (API) and in `docs/` (docs) at the same time.

Update `docs/.env.production` and `docs/.env.develop` with the real API URLs before deploying; the build warns while they are
placeholders. For personal overrides use `docs/.env.development.local` (ignored by git).

## Data sources

Part of the data comes from the [Genshin Impact Wiki](https://genshin-impact.fandom.com/) on Fandom,
available under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The docs footer
includes the attribution.
