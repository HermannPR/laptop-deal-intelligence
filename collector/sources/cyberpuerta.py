from __future__ import annotations

import json
from collections.abc import Sequence
from typing import Any

from bs4 import BeautifulSoup

from collector.domain import CollectedListing
from collector.normalization.specs import extract_specs, normalize_brand, parse_price
from collector.sources.base import SourceAdapter


class CyberpuertaAdapter(SourceAdapter):
    slug = "cyberpuerta"
    display_name = "Cyberpuerta"
    catalog_url = "https://www.cyberpuerta.mx/Laptops-Gamer//"

    def collect(self) -> Sequence[CollectedListing]:
        response = self.client.get(self.catalog_url)
        response.raise_for_status()
        return self.parse(response.text)

    def parse(self, html: str) -> list[CollectedListing]:
        soup = BeautifulSoup(html, "html.parser")
        products: list[CollectedListing] = []
        for script in soup.select('script[type="application/ld+json"]'):
            try:
                payload = json.loads(script.string or "null")
            except json.JSONDecodeError:
                continue
            for item in self._products(payload):
                listing = self._from_json_ld(item)
                if listing:
                    products.append(listing)
        return list({product.external_id: product for product in products}.values())

    def _products(self, payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, list):
            return [entry for value in payload for entry in self._products(value)]
        if not isinstance(payload, dict):
            return []
        if payload.get("@type") == "Product":
            return [payload]
        # Catalog pages wrap Product nodes as ItemList -> ListItem -> item.
        return [entry for value in payload.values() for entry in self._products(value)]

    def _from_json_ld(self, item: dict[str, Any]) -> CollectedListing | None:
        offers = item.get("offers")
        if isinstance(offers, list):
            offers = offers[0] if offers else None
        if not isinstance(offers, dict) or not offers.get("price"):
            return None
        title = str(item.get("name") or "").strip()
        sku = str(item.get("sku") or "").strip()
        url = str(offers.get("url") or item.get("url") or "").strip()
        if not title or not sku or not url:
            return None

        shipping = ((offers.get("shippingDetails") or {}).get("shippingRate") or {}).get("value")
        availability = str(offers.get("availability") or "").casefold()
        specs = extract_specs(title)
        return CollectedListing(
            source_slug=self.slug,
            external_id=sku,
            title=title,
            product_url=url,
            seller=((offers.get("seller") or {}).get("name")),
            brand=normalize_brand(title),
            model_number=sku,
            condition="new",
            price_mxn=parse_price(offers.get("price")),
            shipping_mxn=parse_price(shipping),
            stock_status="in_stock" if "instock" in availability else "out_of_stock",
            raw_source=item,
            **specs,
        )
