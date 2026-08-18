# LapScrapper

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

Run a live direct adapter without writing data:

```bash
python -m collector.cli --source cyberpuerta --dry-run
python -m collector.cli --source decme --dry-run
```

To persist observations, set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the limited
`COLLECTOR_INGEST_TOKEN`. The collector never receives the Supabase service-role key. Mercado Libre
additionally requires `MELI_ACCESS_TOKEN`; the application does not bypass its access controls.
Google Shopping discovery requires `SERPAPI_API_KEY` and records supported retailer prices as
Google-reported observations so they are not confused with direct retailer checks. Its six-hour runs
rotate NVIDIA RTX 4050/4060/5050/5060/5070/5070 Ti/5080 searches across Amazon, Mercado Libre,
Walmart, Bodega Aurrera, DDTech, Liverpool, Office Depot, and Costco. A full rotation takes roughly
42 hours while still using about 120 searches in a 30-day month.

## Database

Apply `supabase/migrations/202608070001_initial.sql` to the Supabase project. The public/anonymous role has
read-only access to normalized catalog and price facts. Mutation remains restricted to the server-side
service role. Never expose that key to the browser.

## Price analysis

The dashboard and product detail pages use observed price history rather than retailer discount labels.
They show 7/30/90-day averages, historical range, a confidence-aware price opportunity score, and an
evidence-based BUY NOW/CONSIDER/WAIT label. A separate GPU Bang for Buck signal compares sourced benchmark
performance per 1,000 MXN and nearby alternatives. See [price intelligence](docs/price-intelligence.md) and
[hardware value](docs/hardware-value.md) for formulas and current limitations.

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

- BUY/WAIT currently evaluates price timing only. GPU Bang for Buck is separate and does not yet include
  CPU, display, battery, build quality, upgradeability, cooling, or model-specific TGP.
- Mercado Libre live collection needs an authorized API token.
- Google Shopping discovery links to Google's product result and may be stale or incomplete. It is a
  discovery fallback for supported retailers, not authoritative direct collection.
- Cross-store fuzzy matching is intentionally not automatic yet.
- Dashboard data is read-only and access control for the personal deployment is deferred until live data exists.

See [architecture](docs/architecture.md) for pipeline and source-adapter details.
