from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


class CollectedListing(BaseModel):
    source_slug: str
    source_name: str | None = None
    external_id: str
    title: str
    product_url: HttpUrl
    seller: str | None = None
    brand: str | None = None
    model_number: str | None = None
    cpu_model: str | None = None
    gpu_model: str | None = None
    ram_gb: int | None = None
    storage_gb: int | None = None
    screen_size_inches: Decimal | None = None
    resolution: str | None = None
    keyboard_layout: str | None = None
    condition: Literal["new", "refurbished", "used", "unknown"] = "unknown"
    price_mxn: Decimal = Field(gt=0)
    shipping_mxn: Decimal = Field(default=Decimal("0"), ge=0)
    stock_status: Literal["in_stock", "low_stock", "out_of_stock", "unknown"] = "unknown"
    observed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    raw_source: dict[str, Any] = Field(default_factory=dict)

    @property
    def effective_price_mxn(self) -> Decimal:
        return self.price_mxn + self.shipping_mxn
