from __future__ import annotations

import os
from typing import Any

import httpx

from collector.domain import CollectedListing
from collector.normalization.specs import canonical_key


class SupabaseWriter:
    """Write observations through the narrow, token-protected ingestion RPC."""

    def __init__(self) -> None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_PUBLISHABLE_KEY")
        self.ingest_token = os.getenv("COLLECTOR_INGEST_TOKEN")
        if not url or not key or not self.ingest_token:
            raise RuntimeError(
                "SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and COLLECTOR_INGEST_TOKEN are required"
            )
        self.client = httpx.Client(
            base_url=f"{url.rstrip('/')}/rest/v1/",
            timeout=30,
            headers={"apikey": key},
        )

    def persist(self, source_name: str, listings: list[CollectedListing]) -> None:
        if not listings:
            return
        response = self.client.post(
            "rpc/ingest_collected_listings",
            json={
                "p_token": self.ingest_token,
                "p_source_slug": listings[0].source_slug,
                "p_source_name": source_name,
                "p_listings": [self._serialize(item) for item in listings],
            },
        )
        response.raise_for_status()

    def _serialize(self, item: CollectedListing) -> dict[str, Any]:
        product_key = canonical_key(item.brand, item.model_number or item.title)
        payload = item.model_dump(mode="json")
        payload["product_url"] = str(item.product_url)
        payload["effective_price_mxn"] = str(item.effective_price_mxn)
        payload["product_key"] = product_key
        payload["configuration_key"] = canonical_key(
            product_key,
            item.cpu_model,
            item.gpu_model,
            item.ram_gb,
            item.storage_gb,
            item.resolution,
        )
        return payload
