from __future__ import annotations

import os
from typing import Any

import httpx

from collector.domain import CollectedListing
from collector.normalization.specs import canonical_key


class SupabaseWriter:
    def __init__(self) -> None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
        self.client = httpx.Client(
            base_url=f"{url.rstrip('/')}/rest/v1/",
            timeout=30,
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )

    def persist(self, source_name: str, listings: list[CollectedListing]) -> None:
        source = self._upsert(
            "sources",
            {"slug": listings[0].source_slug, "display_name": source_name, "enabled": True},
            "slug",
        )
        run = self._insert(
            "source_runs",
            {"source_id": source["id"], "status": "running", "listings_found": len(listings)},
        )
        try:
            for item in listings:
                self._persist_listing(source["id"], item)
            self._patch("source_runs", run["id"], {"status": "succeeded"})
        except Exception as error:
            self._patch(
                "source_runs", run["id"], {"status": "failed", "error_summary": str(error)[:1000]}
            )
            raise

    def _persist_listing(self, source_id: str, item: CollectedListing) -> None:
        product_key = canonical_key(item.brand, item.model_number or item.title)
        product = self._upsert(
            "canonical_products",
            {
                "canonical_key": product_key,
                "brand": item.brand or "Unknown",
                "family": item.title[:160],
            },
            "canonical_key",
        )
        config_key = canonical_key(
            product_key,
            item.cpu_model,
            item.gpu_model,
            item.ram_gb,
            item.storage_gb,
            item.resolution,
        )
        config = self._upsert(
            "product_configurations",
            {
                "product_id": product["id"],
                "canonical_key": config_key,
                "model_number": item.model_number,
                "cpu_model": item.cpu_model,
                "gpu_model": item.gpu_model,
                "ram_gb": item.ram_gb,
                "storage_gb": item.storage_gb,
                "screen_size_inches": str(item.screen_size_inches)
                if item.screen_size_inches
                else None,
                "resolution": item.resolution,
            },
            "canonical_key",
        )
        listing = self._upsert(
            "listings",
            {
                "source_id": source_id,
                "configuration_id": config["id"],
                "external_id": item.external_id,
                "seller": item.seller,
                "title": item.title,
                "product_url": str(item.product_url),
                "condition": item.condition,
                "stock_status": item.stock_status,
                "last_seen_at": item.observed_at.isoformat(),
            },
            "source_id,external_id",
        )
        self._insert(
            "price_observations",
            {
                "listing_id": listing["id"],
                "price_mxn": str(item.price_mxn),
                "shipping_mxn": str(item.shipping_mxn),
                "effective_price_mxn": str(item.effective_price_mxn),
                "stock_status": item.stock_status,
                "observed_at": item.observed_at.isoformat(),
                "raw_source": item.raw_source,
            },
        )

    def _upsert(self, table: str, payload: dict[str, Any], conflict: str) -> dict[str, Any]:
        response = self.client.post(
            table,
            params={"on_conflict": conflict},
            headers={"Prefer": "resolution=merge-duplicates,return=representation"},
            json=payload,
        )
        response.raise_for_status()
        return response.json()[0]

    def _insert(self, table: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.client.post(
            table, headers={"Prefer": "return=representation"}, json=payload
        )
        response.raise_for_status()
        return response.json()[0]

    def _patch(self, table: str, row_id: str, payload: dict[str, Any]) -> None:
        response = self.client.patch(table, params={"id": f"eq.{row_id}"}, json=payload)
        response.raise_for_status()
