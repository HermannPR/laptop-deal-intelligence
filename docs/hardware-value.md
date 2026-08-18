# Hardware value (Bang for Buck)

The first hardware-value signal compares reference GPU performance with the listing's effective price.
It is intentionally separate from the **Price Opportunity** score.

## Formula

```text
GPU points per 1,000 MXN = reference GPU benchmark score / (effective price MXN / 1,000)
```

The dashboard can sort by this value. A larger number means more reference GPU performance per peso;
it does not mean that the laptop is better in every respect.

## Reference data

GPU scores currently use the laptop-GPU results from
[UL Benchmarks' GPU comparison](https://benchmarks.ul.com/compare/best-gpus), using **3DMark Steel Nomad**.
The database records the benchmark, score, source URL, verification date, and limitations for every
normalized GPU model. References can therefore be updated without changing application code.

Laptop performance varies by GPU power limit (TGP), cooling, memory configuration, and manufacturer.
The reference is a class-level comparison until model-specific evidence is available.

## What it does not include yet

- CPU performance
- VRAM capacity as a separate factor
- Display, battery, keyboard, build, or cooling quality
- RAM and storage upgradeability
- Model-specific GPU TGP

These belong in the future profile-weighted value model. The current label is deliberately
**Bang for Buck GPU**, not an overall laptop score.

## Freshness and nearby alternatives

Listings older than their source's configured freshness threshold are hidden by default. Users may
include them explicitly, in which case the UI marks them as expired. Product analysis also retrieves
currently fresh alternatives within 20% above or below the candidate's effective price and ranks those
alternatives by GPU points per 1,000 MXN.
