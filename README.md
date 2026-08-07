# Precio Justo — Laptop Deal Intelligence

Personal purchasing intelligence for laptop offers in Mexico. The first milestone collects structured
store data, preserves observed prices, and presents a filterable evidence-first dashboard.

## Local setup

Requirements: Node.js 22+, Python 3.11+, and npm.

```bash
npm install
python -m venv .venv
.venv/Scripts/python -m pip install -e ".[dev]"
copy .env.example .env.local
npm run dev
```

Without Supabase variables the web app intentionally renders a clearly labelled demonstration dataset.

## Collector

Run the live Cyberpuerta JSON-LD adapter without writing data:

```bash
python -m collector.cli --source cyberpuerta --dry-run
```

To persist observations, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Mercado Libre additionally
requires `MELI_ACCESS_TOKEN`; the application does not bypass its access controls.

## Database

Apply `supabase/migrations/202608070001_initial.sql` to the Supabase project. The public/anonymous role has
read-only access to normalized catalog and price facts. Mutation remains restricted to the server-side
service role. Never expose that key to the browser.

## Checks

```bash
npm run lint
npm run typecheck
npm run test:web
npm run build
pytest
ruff check .
```

## Deployment

Set Vercel's root directory to `apps/web`, then configure `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Add collector secrets to GitHub Actions. The collection workflow runs at
minute 17 every six hours to avoid GitHub's busiest scheduling boundary.

## Current limitations

- Historical intelligence and Deal Score arrive in Milestone 2 after enough observations exist.
- Mercado Libre live collection needs an authorized API token.
- Cross-store fuzzy matching is intentionally not automatic yet.
- Dashboard data is read-only and access control for the personal deployment is deferred until live data exists.

See [architecture](docs/architecture.md) for pipeline and source-adapter details.
