# Architecture

The product uses a deliberately small, two-runtime architecture:

- `apps/web`: a read-oriented Next.js application deployed to Vercel.
- `collector`: short-lived Python collection jobs run by GitHub Actions.
- `supabase`: PostgreSQL migrations and row-level security policies.

Collection never occurs during a user web request. Each source adapter returns the same
`CollectedListing` contract. A source failure is logged independently and cannot prevent other adapters
from being attempted. Observations are append-only; current prices are derived from the latest observation.

## Normalization pipeline

1. Fetch using a descriptive user agent and low schedule frequency.
2. Parse structured API or JSON-LD data where available.
3. Normalize only facts present in the source.
4. Build a conservative configuration signature.
5. Upsert listing identity and append a price observation.
6. Expose the latest observation through the `listing_current` database view.

Manufacturer model numbers are stronger than title similarity. The MVP does not automatically merge fuzzy
matches. Later milestones will add a match-candidate review queue and explicit confidence evidence.

## Adding a source

1. Implement `collector.sources.base.SourceAdapter`.
2. Parse a saved, sanitized fixture in `tests/fixtures`.
3. Add parser failure, missing-field, and price-format tests.
4. Register the adapter in `collector/cli.py`.
5. Verify robots guidance and terms before enabling scheduled requests.

