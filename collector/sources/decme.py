from __future__ import annotations

import re
from collections.abc import Sequence
from typing import Any

from bs4 import BeautifulSoup

from collector.domain import CollectedListing
from collector.normalization.specs import extract_specs, normalize_brand, parse_price
from collector.sources.base import SourceAdapter


class DecmeAdapter(SourceAdapter):
    """Collect Grupo DECME's public Shopify gaming-laptop catalog."""

    slug = "decme"
    display_name = "Grupo DECME"
    catalog_url = "https://grupodecme.com/collections/computo-laptops-gamer/products.json"
    storefront_url = "https://grupodecme.com"

    def collect(self) -> Sequence[CollectedListing]:
        response = self.client.get(self.catalog_url, params={"limit": 250})
        response.raise_for_status()
        return self.parse(response.json())

    def parse(self, payload: dict[str, Any]) -> list[CollectedListing]:
        listings: list[CollectedListing] = []
        for product in payload.get("products", []):
            title = str(product.get("title") or "").strip()
            handle = str(product.get("handle") or "").strip()
            variants = product.get("variants") or []
            if not title or not handle or not variants:
                continue

            for variant in variants:
                price = parse_price(variant.get("price"))
                variant_id = str(variant.get("id") or "").strip()
                if not variant_id or price <= 0:
                    continue
                sku = str(variant.get("sku") or "").strip() or None
                variant_title = str(variant.get("title") or "").strip()
                resolved_title = (
                    title
                    if variant_title in {"", "Default Title"}
                    else f"{title} — {variant_title}"
                )
                specs = self._specs(product, resolved_title)
                listings.append(
                    CollectedListing(
                        source_slug=self.slug,
                        external_id=variant_id,
                        title=resolved_title,
                        product_url=f"{self.storefront_url}/products/{handle}?variant={variant_id}",
                        seller=self.display_name,
                        brand=normalize_brand(resolved_title),
                        model_number=sku,
                        condition=self._condition(resolved_title),
                        price_mxn=price,
                        stock_status="in_stock" if variant.get("available") else "out_of_stock",
                        raw_source=self._raw_source(product, variant),
                        **specs,
                    )
                )
        return listings

    def _specs(self, product: dict[str, Any], title: str) -> dict[str, object | None]:
        specs = extract_specs(title)
        tags = [str(tag) for tag in product.get("tags") or []]

        memory_tag = next(
            (
                tag
                for tag in tags
                if tag.casefold().startswith(("memoria_", "systemmemorysize_"))
            ),
            None,
        )
        storage_tag = next(
            (
                tag
                for tag in tags
                if tag.casefold().startswith(("almacenamiento_", "hddsize_"))
            ),
            None,
        )
        keyboard_tag = next(
            (tag for tag in tags if tag.casefold().startswith("idioma del teclado_")),
            None,
        )
        if memory_tag:
            specs["ram_gb"] = self._capacity_gb(memory_tag)
        if storage_tag:
            specs["storage_gb"] = self._capacity_gb(storage_tag)
        specs["keyboard_layout"] = (
            keyboard_tag.split("_", 1)[-1].title() if keyboard_tag else None
        )

        body_text = BeautifulSoup(
            str(product.get("body_html") or ""), "html.parser"
        ).get_text(" ")
        body_specs = extract_specs(body_text)
        for field in ("resolution", "screen_size_inches"):
            if specs.get(field) is None:
                specs[field] = body_specs.get(field)
        return specs

    @staticmethod
    def _capacity_gb(value: str) -> int | None:
        match = re.search(r"(\d+(?:\.\d+)?)\s*(TB|GB)", value, re.IGNORECASE)
        if not match:
            return None
        amount = float(match.group(1))
        return round(amount * (1024 if match.group(2).upper() == "TB" else 1))

    @staticmethod
    def _raw_source(product: dict[str, Any], variant: dict[str, Any]) -> dict[str, Any]:
        return {
            "product": {
                key: product.get(key)
                for key in (
                    "id",
                    "title",
                    "handle",
                    "body_html",
                    "published_at",
                    "updated_at",
                    "vendor",
                    "product_type",
                    "tags",
                )
            },
            "selected_variant": variant,
        }

    @staticmethod
    def _condition(title: str) -> str:
        normalized = title.casefold()
        if any(marker in normalized for marker in ("reacondicion", "recertific", "refurbish")):
            return "refurbished"
        return "new"
