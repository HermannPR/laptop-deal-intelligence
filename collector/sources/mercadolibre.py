from __future__ import annotations

import os
from collections.abc import Sequence

from collector.domain import CollectedListing
from collector.normalization.specs import extract_specs, normalize_brand, parse_price
from collector.sources.base import SourceAdapter


class MercadoLibreAdapter(SourceAdapter):
    slug = "mercadolibre"
    display_name = "Mercado Libre"
    endpoint = "https://api.mercadolibre.com/sites/MLM/search"

    def collect(self) -> Sequence[CollectedListing]:
        token = os.getenv("MELI_ACCESS_TOKEN")
        if not token:
            raise RuntimeError(
                "MELI_ACCESS_TOKEN is required; public search currently rejects requests"
            )
        response = self.client.get(
            self.endpoint,
            params={"q": "laptop gamer", "limit": 50},
            headers={"Authorization": f"Bearer {token}"},
        )
        response.raise_for_status()
        return self.parse(response.json())

    def parse(self, payload: dict) -> list[CollectedListing]:
        listings: list[CollectedListing] = []
        for item in payload.get("results", []):
            title = str(item.get("title") or "").strip()
            external_id = str(item.get("id") or "").strip()
            url = str(item.get("permalink") or "").strip()
            if not title or not external_id or not url or not item.get("price"):
                continue
            specs = extract_specs(title)
            listings.append(
                CollectedListing(
                    source_slug=self.slug,
                    external_id=external_id,
                    title=title,
                    product_url=url,
                    seller=str((item.get("seller") or {}).get("nickname") or "") or None,
                    brand=normalize_brand(title),
                    condition={"new": "new", "used": "used"}.get(item.get("condition"), "unknown"),
                    price_mxn=parse_price(item.get("price")),
                    shipping_mxn=parse_price((item.get("shipping") or {}).get("cost")),
                    stock_status="in_stock"
                    if item.get("available_quantity", 0)
                    else "out_of_stock",
                    raw_source=item,
                    **specs,
                )
            )
        return listings
