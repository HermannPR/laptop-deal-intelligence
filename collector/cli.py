from __future__ import annotations

import argparse
import json
import logging

from collector.sources.cyberpuerta import CyberpuertaAdapter
from collector.sources.google_shopping import GoogleShoppingAdapter
from collector.sources.mercadolibre import MercadoLibreAdapter
from collector.storage import SupabaseWriter

ADAPTERS = {
    "cyberpuerta": CyberpuertaAdapter,
    "google-shopping": GoogleShoppingAdapter,
    "mercadolibre": MercadoLibreAdapter,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect Mexican laptop listings")
    parser.add_argument("--source", choices=[*ADAPTERS, "all"], default="cyberpuerta")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    sources = list(ADAPTERS) if args.source == "all" else [args.source]
    failures = 0
    for source in sources:
        adapter = ADAPTERS[source]()
        try:
            listings = list(adapter.collect())
            logging.info("source=%s listings=%d", source, len(listings))
            if args.dry_run:
                print(json.dumps([item.model_dump(mode="json") for item in listings[:3]], indent=2))
            elif listings:
                SupabaseWriter().persist(adapter.display_name, listings)
        except Exception:
            failures += 1
            logging.exception("source=%s collection_failed", source)
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
