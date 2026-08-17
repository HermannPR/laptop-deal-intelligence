# Price intelligence

The application separates price opportunity from the future full Deal Score. This prevents a weak laptop
from ranking highly only because its retailer advertises a large discount.

## Observed statistics

`listing_price_intelligence` derives the current effective price, 7/30/90-day averages, historical
minimum and maximum, price-change count, observation count, observed days, and history span from the
append-only `price_observations` table. Retailer list prices do not affect these calculations.

## Price opportunity score

The 0–100 price score is shown only after at least four observations across three days and a two-day time
span. It combines:

- 45%: position between the observed historical minimum and maximum.
- 35%: discount or premium relative to the 30-day average.
- 20%: proximity to the observed historical minimum.

Confidence is reported separately. It increases with observation count and history duration; it never
silently inflates the score. Google Shopping observations retain `google_reported` provenance and are not
presented as direct retailer verification.

## Current recommendation rules

- `BUY NOW`: score at least 82 and at least 5% below the 30-day average.
- `WAIT`: score at most 35 or more than 8% above the 30-day average.
- `CONSIDER`: all other cases, including insufficient history.

`AVOID` is intentionally deferred until hardware performance and nearby competitor evidence are available.
The current recommendation evaluates price timing only and is not a prediction of future prices.
