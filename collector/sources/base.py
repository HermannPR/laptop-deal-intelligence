from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Sequence

import httpx

from collector.domain import CollectedListing


class SourceAdapter(ABC):
    slug: str
    display_name: str

    def __init__(self, client: httpx.Client | None = None) -> None:
        self.client = client or httpx.Client(
            timeout=30,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "LaptopDealIntelligence/0.1 (+personal price research; low-frequency collector)"
                )
            },
        )

    @abstractmethod
    def collect(self) -> Sequence[CollectedListing]:
        raise NotImplementedError
