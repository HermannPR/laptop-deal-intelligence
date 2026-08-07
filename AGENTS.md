# AGENTS.md

## Project: Laptop Deal Intelligence

### Mission
Build a robust software product that continuously monitors laptop prices in Mexico, identifies genuine deals, compares hardware value across listings and stores, and helps a user decide whether to buy now or wait.

The core question the product must answer is:

> Is this laptop actually a good buy at this price, relative to its real price history, competing products, hardware capabilities, and the user's intended use?

Do not optimize for reproducing store discount labels. Optimize for trustworthy purchasing intelligence.

---

## Autonomy and Technical Decision-Making

You are the primary implementation agent. You are explicitly authorized to choose the technology stack, architecture, libraries, database, frameworks, deployment approach, scraping strategy, APIs, background-job system, testing tools, and project structure.

Choose whatever is most practical, reliable, maintainable, and efficient for you to implement and operate.

Do not ask the user to choose between technical stacks unless there is a genuine product-level tradeoff they need to decide. Prefer making sensible engineering decisions yourself and documenting them.

Favor simplicity for the first working version, but do not create an architecture that prevents later expansion.

When a site offers a stable official API, prefer it over scraping. When scraping is necessary, use a responsible, resilient approach and respect applicable site rules, rate limits, robots guidance, and terms. Avoid bypassing access controls or anti-bot protections.

---

## Primary User Profile

The initial target user wants a laptop primarily for:

- Software development
- VS Code and developer tooling
- AI tools and agents
- Claude, ChatGPT, Gemini, and related services
- Docker and development environments
- Potential local AI/model experimentation
- Gaming
- Future AAA games, including GTA VI if/when a PC version becomes available
- Long useful life
- Maximum performance/value for money

The system must eventually support configurable profiles beyond this initial user.

---

## Geographic Scope

Initial market: **Mexico**.

All monetary values should be normalized to **MXN** unless clearly marked otherwise.

The system should be designed so other countries/markets can be added later.

---

## Stores and Sources

Initially investigate and support as many of these as are practical and legally/technically reasonable:

- Amazon Mexico
- Mercado Libre Mexico
- Walmart Mexico
- Cyberpuerta
- DDTech
- Liverpool
- Office Depot Mexico
- Costco Mexico
- Lenovo Mexico
- ASUS Mexico
- HP Mexico
- Acer Mexico

The source layer must be extensible so new stores can be added without redesigning the entire product.

Do not block the initial release waiting for every store. Start with a small set of reliable sources, validate the end-to-end system, then expand.

---

## Product Data Model

For each listing, capture as much of the following as can be reliably extracted:

- Store
- Seller/merchant when applicable
- Listing title
- Brand
- Product family
- Exact model number / SKU when available
- Canonical product identity
- CPU brand and exact model
- CPU generation/family
- GPU brand and exact model
- GPU VRAM
- GPU power/TGP when available
- Integrated GPU
- RAM capacity
- RAM type
- RAM configuration if available
- Whether RAM is upgradeable
- Maximum RAM if known
- Storage capacity
- Storage type
- Number of storage slots when available
- Storage upgradeability
- Screen size
- Resolution
- Refresh rate
- Panel type
- Brightness
- Color gamut / sRGB coverage when available
- Battery capacity when available
- Weight
- Ports
- Wi-Fi version
- Operating system
- Keyboard language/layout when available
- Condition: new/refurbished/used
- Warranty information when available
- Current price
- Shipping cost if relevant
- Effective total price
- Financing/promotional information when useful
- Advertised original/list price
- Advertised discount percentage
- Availability / stock state
- Product URL
- Timestamp of observation

Store raw source data as needed so parsers can be improved later without losing provenance.

---

## Product Normalization and Deduplication

A critical requirement is to recognize when listings from different stores represent the same laptop or equivalent hardware configuration even if titles differ.

Example:

- "Lenovo LOQ 15AHP10 Ryzen 7 250 RTX5060 16GB 512GB"
- "Laptop Gamer Lenovo LOQ 15.6 RTX 5060 AMD R7 16 GB"

These may represent the same or closely related configurations.

Create a canonical product/configuration identity using the strongest available identifiers such as:

- Manufacturer model number
- SKU
- CPU
- GPU
- RAM
- Storage
- Display
- Other distinguishing characteristics

Do not incorrectly merge materially different configurations.

Maintain confidence or provenance for inferred matches when useful.

---

## Historical Price Tracking

Maintain a durable price history for every listing and, when possible, every canonical product/configuration.

Support at least:

- Current price
- 7-day average
- 30-day average
- 90-day average
- Historical minimum
- Historical maximum
- Number of observed price changes
- Time spent near the current price

Do not treat the store's crossed-out/list price as authoritative.

The user's own observed historical data should be the primary basis for determining whether a discount is real.

Example analysis:

> Current price: $23,999 MXN
> 30-day average: $26,800 MXN
> Historical minimum: $22,900 MXN
> Real discount vs. 30-day average: 10.5%

---

## Real Deal Detection

The system must distinguish between:

1. **Advertised discount**: what the merchant claims.
2. **Observed discount**: how far the current price is below historical market prices.
3. **Value opportunity**: whether the hardware is actually good for the money.

A large advertised discount must not automatically create a high deal score.

Example:

> Store advertises: 31% OFF
> Observed 30-day market discount: 9.8%
> Verdict: Good price, but the advertised percentage is misleading as a measure of actual savings.

---

## Performance and Value Intelligence

Create a normalized performance/value model.

The model should evaluate at least:

- CPU performance
- GPU performance
- VRAM
- RAM capacity
- Storage
- Screen quality
- Upgradeability
- Cooling/build quality when reliable data is available
- Battery/portability when relevant
- Generation/age of hardware
- Known limitations

Do not use arbitrary permanent hard-coded scores if a better evidence-based approach is practical. Prefer maintainable benchmark/reference data, normalized scoring, or a configurable weighting system.

The key output is **value for money**, not merely raw performance.

Example:

A $17,000 RTX 4050 laptop may look inexpensive, but if an RTX 5060 model costs $19,000 and offers substantially more usable performance, the system should recommend spending the additional amount when appropriate.

---

## User Profiles and Weighted Recommendations

Support configurable recommendation profiles.

Initial profiles:

### Gaming
Prioritize:
- GPU performance
- VRAM
- Cooling
- Display refresh rate and quality
- CPU gaming performance

### Programming
Prioritize:
- CPU
- RAM
- Keyboard usability when data exists
- Battery
- Upgradeability
- Portability
- Developer-tool compatibility

### AI / Development
Prioritize:
- GPU
- VRAM
- RAM
- CPU
- Storage
- CUDA/NVIDIA ecosystem where relevant
- Ability to run development/AI workloads

### Office / Productivity
Prioritize:
- Battery
- Weight
- Display
- Keyboard
- Price
- Reliability

### Personal Combined Profile
Prioritize a balanced mix of:
- Programming
- AI experimentation
- Gaming
- Long useful life
- Upgradeability
- High benefit/cost ratio

Weights should be configurable rather than embedded irreversibly in code.

---

## Search and Discovery

The system must not require users to already know a laptop model.

Support queries such as:

- "Best gaming laptop under $25,000 MXN"
- "Best laptop for programming and gaming between $20,000 and $30,000"
- "Any RTX 5060 laptop worth buying today?"
- "Best value laptop for local AI under $30,000"

Search should support both natural-language intent and structured filters.

---

## Filters

Support filters including, when data is available:

- Minimum price
- Maximum price
- GPU
- Minimum VRAM
- CPU
- Minimum RAM
- Minimum SSD
- Brand
- Screen size
- Resolution
- Refresh rate
- Weight
- Battery
- Store
- Condition
- RAM upgradeability
- Storage upgradeability

---

## Deal Score

Create a transparent **Deal Score from 0 to 100**.

The score should consider factors such as:

- Historical price position
- Real discount vs. recent averages
- Price vs. competitors
- Hardware performance
- Performance per peso
- Configuration quality
- Upgradeability
- Product generation/age
- Known model quality when reliable evidence exists

The scoring formula should be explainable and configurable.

Do not allow a weak laptop with a huge advertised discount to outrank a substantially better laptop with a smaller discount solely because of the discount percentage.

Example output:

> Deal Score: 94/100
> Strong reasons: near historical minimum, excellent GPU/price ratio, upgradeable RAM and SSD.
> Weaknesses: 512 GB base storage, mediocre display color gamut.

---

## Buy vs. Wait Recommendation

For each product, produce one of at least:

- **BUY NOW**
- **WAIT**
- **CONSIDER**
- **AVOID**

The recommendation must be evidence-based, not a claim of certainty about future prices.

Use signals such as:

- Historical minimum
- Frequency of previous price drops
- Current deviation from 30/90-day average
- Upcoming major retail events
- Availability/stock risk if known
- Competing alternatives available now

Example:

> WAIT
> Current price: $26,499
> This configuration has reached ~$22,999 multiple times in the last 90 days and is currently 11% above its observed minimum.

Example:

> BUY NOW
> Current price: $22,799
> Lowest observed price, 17% below the 90-day average, and no materially better competitor within $2,000.

Never present the result as guaranteed future price prediction.

---

## Mexican Retail Calendar Awareness

Account for major promotional periods where useful, such as:

- Hot Sale
- Amazon Prime Day / major Amazon promotional events
- Back-to-school promotions
- Buen Fin
- Black Friday
- Cyber Monday
- Christmas / year-end promotions

Dates should not be permanently hardcoded if they can vary by year. Make event data maintainable.

This context may influence BUY/WAIT analysis, but should never override a genuinely exceptional current deal without justification.

---

## Watchlist

Users should be able to save laptops/configurations to a watchlist.

For each watchlist item show:

- Current best price
- Store
- Price movement
- Distance from historical minimum
- Deal Score
- Buy/wait recommendation

Allow users to compare watchlist items over time.

---

## Alerts

Support user-defined alerts such as:

- Notify me when an RTX 5060 laptop with at least 16 GB RAM drops below $23,000 MXN.
- Notify me when an RTX 5070 laptop drops below $28,000 MXN.
- Notify me when a Lenovo Legion has a real observed discount above 20%.
- Notify me when a watchlisted laptop reaches a new historical low.
- Notify me when any laptop matching my personal profile reaches a Deal Score above 90.

Choose an appropriate notification mechanism for the initial version and design the system so additional channels can be added later.

Avoid repeated spam for the same unchanged condition. Implement sensible alert deduplication/cooldowns.

---

## Comparison Tool

Allow comparison of at least 2-5 laptops side by side.

Compare:

- Effective price
- CPU
- GPU
- VRAM
- RAM
- SSD
- Display
- Upgradeability
- Weight/battery where available
- Gaming score
- Programming score
- AI/development score
- Overall value score
- Deal Score

Also provide a concise human-readable conclusion.

Example:

> The Legion is the better laptop overall, but the LOQ currently provides the best value because it is $4,500 cheaper while retaining the same GPU class.

---

## Opportunity Feed

Create a high-signal section such as **Hot Opportunities**.

Only include unusually strong opportunities, such as:

- New historical low
- More than a configurable percentage below 30-day average
- Exceptional performance-per-peso
- Clearance pricing
- A previous-generation premium model priced below current lower-tier models
- Potential pricing anomaly, clearly labeled as unverified

Avoid filling this section with ordinary sales.

---

## Competitor-Aware Recommendation

A product analysis must consider nearby alternatives.

Example:

> Do not buy this RTX 4050 model at $18,900. A current RTX 5060 option costs $20,500 and offers substantially better long-term value.

The system should search within a reasonable price band above and below the candidate, not just compare exact prices.

Allow the price-band threshold to be configurable.

---

## Product Detail Experience

A product detail page/view should ideally present:

- Product identity
- Current price and best store
- Price-history chart
- Historical low/high
- 7/30/90-day averages
- Advertised vs. observed discount
- Hardware summary
- Strengths
- Weaknesses
- Upgradeability
- Deal Score and explanation
- User-profile scores
- Competing alternatives
- BUY/WAIT/CONSIDER/AVOID recommendation
- Evidence behind the recommendation

---

## Dashboard

The main experience should quickly answer:

### Best Buys Today
Show the strongest current value options for the selected profile/budget.

Example:

1. Lenovo LOQ RTX 5060 — $22,999 — Deal Score 96
2. Acer Nitro RTX 5070 — $27,499 — Deal Score 94
3. ASUS TUF RTX 5060 — $23,799 — Deal Score 91

### Deal of the Day / Top Opportunity
Show only if a product genuinely qualifies.

### Watchlist Changes
Show important changes since the last check.

### Market Snapshot
Useful aggregate signals such as the typical current price range for RTX 5060 laptops.

---

## Data Quality and Confidence

Not all product data will be available or equally reliable.

Track provenance and confidence where practical.

Do not fabricate missing specifications.

If a listing does not provide GPU TGP, display it as unknown rather than inferring a precise number without a reliable source.

When external benchmark/specification data is used, retain source attribution internally and design the system so data can be refreshed.

---

## Security and Privacy

- Do not store secrets directly in source code.
- Use appropriate secret/configuration management.
- Sanitize and validate external data.
- Do not execute arbitrary content scraped from websites.
- Apply normal web security practices to any user-facing application.
- Collect only the user data necessary for product features.

---

## Reliability Requirements

The application should tolerate individual source failures.

One store changing its page structure must not crash the entire monitoring system.

Implement:

- Source-specific error handling
- Logging
- Retry strategy where appropriate
- Rate limiting
- Health/status visibility
- Detection of stale data

Mark stale prices rather than presenting them as current.

---

## Testing Expectations

Create meaningful automated tests for the highest-risk logic, especially:

- Price parsing
- Currency normalization
- Product normalization
- Deduplication
- Historical calculations
- Deal Score
- Buy/wait rules
- Filtering
- Alert triggering and deduplication

Use fixtures/sample responses for source parsers where practical so site-parser changes can be detected quickly.

---

## Observability

Provide enough logs/metrics to answer:

- Which sources are succeeding or failing?
- When was each source last successfully checked?
- How many listings were found?
- How many canonical products were updated?
- How many alerts were triggered?
- Are prices stale?

Do not over-engineer observability for the first version, but make failures diagnosable.

---

## Development Approach

Implement in iterative milestones.

### Milestone 1 — End-to-End MVP

Build the smallest useful complete workflow:

- One or two reliable Mexican sources
- Discover laptop listings
- Normalize basic specifications
- Persist products and observed prices
- Show current products
- Basic filters
- Historical price storage

The MVP should actually run and collect useful data before expanding scope.

### Milestone 2 — Price Intelligence

Add:

- Historical averages
- Historical minimum/maximum
- Real discount calculation
- Basic Deal Score
- Product detail view

### Milestone 3 — Hardware Intelligence

Add:

- Better specification normalization
- Benchmark/reference data
- Performance/value scoring
- Profile-specific scores
- Competitor-aware recommendations

### Milestone 4 — Decision Support

Add:

- BUY/WAIT/CONSIDER/AVOID
- Watchlist
- Comparison tool
- Hot Opportunities

### Milestone 5 — Automation

Add:

- Scheduled monitoring
- Alerts
- Alert deduplication
- More stores

### Milestone 6 — Refinement

Improve:

- Matching accuracy
- UI/UX
- Data-source reliability
- Scoring calibration
- Performance
- Deployment/operations

You may revise these milestones if a different sequence is technically more practical, while preserving the product objectives.

---

## Engineering Principles

1. **Working software over speculative architecture.**
2. **Reliable data over broad but inaccurate coverage.**
3. **Observed prices over retailer marketing claims.**
4. **Explainable recommendations over opaque scores.**
5. **Performance per peso over brand prestige.**
6. **Graceful degradation when data is missing.**
7. **Extensible source adapters rather than store-specific logic scattered throughout the codebase.**
8. **Do not prematurely optimize.**
9. **Document major decisions.**
10. **Prefer automated tests around business-critical logic.**

---

## Agent Working Rules

Before large implementation changes:

1. Inspect the existing repository and understand the current state.
2. Reuse working components where sensible.
3. Make a short implementation plan.
4. Implement the smallest coherent increment.
5. Run relevant tests/lint/type checks/build checks.
6. Fix regressions before proceeding.
7. Update documentation when behavior or architecture changes.

Do not rewrite the project unnecessarily simply because you prefer another framework.

If the repository is empty, initialize it using the architecture you judge most appropriate.

When making technical choices, optimize for:

- Developer productivity
- Reliability
- Maintainability
- Availability of ecosystem/library support
- Ease of adding new stores
- Ease of local development
- Reasonable deployment cost

Do not optimize primarily for novelty.

---

## Documentation Required

Maintain concise project documentation covering:

- How to run locally
- How to configure required credentials/settings
- How to run tests
- How to add a new store/source
- How the product-normalization pipeline works
- How Deal Score is computed
- How BUY/WAIT recommendations are generated
- Known limitations

If scoring logic changes materially, document the reasoning.

---

## Definition of Done for the Initial Useful Product

The product is useful when a user can open it and:

1. See current laptop listings from multiple Mexican sources.
2. Filter by budget and relevant hardware.
3. Open a laptop and see its observed price history.
4. See whether the current price is genuinely below its recent historical price.
5. Receive an explainable Deal Score.
6. See nearby competing laptops and understand whether spending slightly more or less offers better value.
7. Receive a clear BUY/WAIT/CONSIDER/AVOID recommendation supported by data.
8. Add products or criteria to a watchlist/alert workflow.

Do not consider the project complete merely because scraping works. The core product is **decision intelligence**, not data collection.

---

## Example Expected Analysis

For a hypothetical Lenovo LOQ:

**Configuration**
- Ryzen 7 250
- RTX 5060 8 GB
- 16 GB DDR5
- 512 GB SSD
- 15.6-inch FHD 144 Hz

**Store price**
- Current: $23,999 MXN
- Advertised original price: $34,999 MXN
- Advertised discount: 31%

**Observed history**
- 30-day average: $26,800 MXN
- 90-day average: $27,500 MXN
- Historical minimum: $22,900 MXN

**System output**

> Real observed discount vs. 30-day average: ~10.5%.
>
> The retailer's 31% label overstates the practical discount relative to observed market pricing, but $23,999 remains a strong current price.
>
> Deal Score: 93/100.
>
> Recommendation: BUY / STRONG CONSIDER, depending on current competing offers and proximity to upcoming promotional events.
>
> Main weakness: 512 GB base storage.
>
> Before recommending, compare against other RTX 5060/5070 laptops within roughly $3,000-$5,000 of the current price.

The exact score and recommendation should be produced by the implemented model, not hard-coded from this example.

---

## Final Product Philosophy

This application should behave like a knowledgeable, skeptical purchasing analyst.

It should not say:

> "31% off, therefore great deal."

It should say:

> "The advertised discount is 31%, but based on observed market history the real discount is closer to 10%. Even so, this configuration is currently one of the strongest performance-per-peso options in its class, and there is no materially better competitor within the configured price band."

That distinction is the core of the product.
