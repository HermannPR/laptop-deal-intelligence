from __future__ import annotations

import os
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any

from collector.domain import CollectedListing
from collector.normalization.specs import extract_specs, normalize_brand, parse_price
from collector.sources.base import SourceAdapter


class GoogleShoppingAdapter(SourceAdapter):
    """Discover otherwise inaccessible listings through Google Shopping via SerpApi.

    These are discovery observations reported by Google, not direct retailer checks. The
    retailer-specific source names keep that provenance visible in the dashboard.
    """

    slug = "google-shopping"
    display_name = "Google Shopping"
    endpoint = "https://serpapi.com/search.json"
    # One query every six hours stays near 120 searches/month while each GPU
    # class receives a market-wide discovery pass once per day.
    search_queries = (
        "laptop gamer RTX 4050 16GB",
        "laptop gamer RTX 5050 16GB",
        "laptop gamer RTX 5060 16GB",
        "laptop gamer RTX 5070 16GB",
    )
    merchant_sources = (
        ("bodega aurrera", ("bodega-aurrera-google", "Bodega Aurrera via Google Shopping")),
        ("mercado libre", ("mercadolibre-google", "Mercado Libre via Google Shopping")),
        ("office depot", ("office-depot-google", "Office Depot via Google Shopping")),
        ("amazon", ("amazon-mexico-google", "Amazon México via Google Shopping")),
        ("walmart", ("walmart-mexico-google", "Walmart México via Google Shopping")),
        ("ddtech", ("ddtech-google", "DDTech via Google Shopping")),
        ("dd tech", ("ddtech-google", "DDTech via Google Shopping")),
        ("liverpool", ("liverpool-google", "Liverpool via Google Shopping")),
        ("costco", ("costco-mexico-google", "Costco México via Google Shopping")),
    )

    def collect(self) -> Sequence[CollectedListing]:
        api_key = os.getenv("SERPAPI_API_KEY")
        if not api_key:
            raise RuntimeError("SERPAPI_API_KEY is required for Google Shopping discovery")
        response = self.client.get(
            self.endpoint,
            params={
                "engine": "google_shopping",
                "q": self.search_query(),
                "gl": "mx",
                "hl": "es",
                "location": "Mexico",
                "api_key": api_key,
            },
        )
        response.raise_for_status()
        return self.parse(response.json())

    def search_query(self, now: datetime | None = None) -> str:
        """Rotate target GPU classes every six hours within SerpApi's free quota."""
        current = now or datetime.now(UTC)
        return self.search_queries[(current.hour // 6) % len(self.search_queries)]

    def parse(self, payload: dict[str, Any]) -> list[CollectedListing]:
        listings: list[CollectedListing] = []
        for item in payload.get("shopping_results", []):
            source = str(item.get("source") or "").strip()
            merchant = self._merchant(source)
            title = str(item.get("title") or "").strip()
            external_id = str(item.get("product_id") or "").strip()
            product_url = str(item.get("product_link") or "").strip()
            price = item.get("extracted_price") or item.get("price")
            if not merchant or not title or not external_id or not product_url or not price:
                continue

            specs = extract_specs(title)
            if not self._is_relevant_laptop(specs):
                continue
            source_slug, source_name = merchant
            listings.append(
                CollectedListing(
                    source_slug=source_slug,
                    source_name=source_name,
                    external_id=f"{source_slug}:{external_id}",
                    title=title,
                    product_url=product_url,
                    seller=source,
                    brand=normalize_brand(title),
                    condition="unknown",
                    price_mxn=parse_price(price),
                    stock_status="unknown",
                    raw_source={**item, "provenance": "google_shopping_reported"},
                    **specs,
                )
            )
        return listings

    def _merchant(self, source: str) -> tuple[str, str] | None:
        normalized = source.casefold()
        return next(
            (identity for marker, identity in self.merchant_sources if marker in normalized),
            None,
        )

    @staticmethod
    def _is_relevant_laptop(specs: dict[str, object | None]) -> bool:
        """Reject low-signal products and GPU accessories from discovery results."""
        if not specs.get("gpu_model"):
            return False
        return any(
            specs.get(field) is not None
            for field in ("cpu_model", "ram_gb", "storage_gb", "screen_size_inches")
        )
