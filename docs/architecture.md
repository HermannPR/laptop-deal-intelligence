# Architecture

The product uses a deliberately small, two-runtime architecture:

- `apps/web`: a read-oriented Next.js application deployed to Vercel.
- `collector`: short-lived Python collection jobs run by GitHub Actions.
- `supabase`: PostgreSQL migrations and row-level security policies.

Collection never occurs during a user web request. Each source adapter returns the same
`CollectedListing` contract. A source failure is logged independently and cannot prevent other adapters
from being attempted. Observations are append-only; current prices are derived from the latest observation.
The `listing_price_intelligence` view derives rolling averages and historical ranges without duplicating
facts, while the application layer computes the documented, unit-tested assessment and recommendation.

## Normalization pipeline

1. Fetch using a descriptive user agent and low schedule frequency.
2. Parse structured API or JSON-LD data where available.
3. Normalize only facts present in the source.
4. Build a conservative configuration signature.
5. Upsert listing identity and append a price observation.
6. Expose the latest observation through the `listing_current` database view.

Scheduled jobs write through `ingest_collected_listings`, a narrowly scoped `SECURITY DEFINER` RPC. The
anonymous role can reach this single function, but every call must present a generated 256-bit token whose
SHA-256 hash is stored in the private schema. The collector never receives the Supabase service-role key.
Supabase's advisor therefore reports the anonymous security-definer function as an intentional warning.

Cyberpuerta collection follows the catalog's published pagination with a hard page limit. Grupo DECME is
read directly from its public Shopify collection feed; store tags override ambiguous title parsing for
RAM, storage, keyboard layout, and other structured facts.

Google Shopping is a discovery adapter rather than a direct retailer adapter. One low-frequency SerpApi
request is filtered to supported merchants, then persisted as separate retailer-labelled sources. Its raw
payload carries `google_shopping_reported` provenance, and its Google product URL is retained instead of
claiming that the price was verified directly. The scheduled query rotates target GPU classes every six
hours. It covers NVIDIA RTX 4050, 4060, 5050, 5060, 5070, 5070 Ti, and 5080, completing a full
market-wide rotation in roughly 42 hours while the collector remains comfortably inside SerpApi's
250-search free allowance. Results without a recognized GPU plus at least one laptop specification are
discarded as low-signal.

Manufacturer model numbers are stronger than title similarity. The MVP does not automatically merge fuzzy
matches. Later milestones will add a match-candidate review queue and explicit confidence evidence.

## Adding a source

1. Implement `collector.sources.base.SourceAdapter`.
2. Parse a saved, sanitized fixture in `tests/fixtures`.
3. Add parser failure, missing-field, and price-format tests.
4. Register the adapter in `collector/cli.py`.
5. Verify robots guidance and terms before enabling scheduled requests.
