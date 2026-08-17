import json
from datetime import UTC, datetime
from pathlib import Path

from collector.sources.cyberpuerta import CyberpuertaAdapter
from collector.sources.google_shopping import GoogleShoppingAdapter
from collector.sources.mercadolibre import MercadoLibreAdapter
from collector.storage import SupabaseWriter

FIXTURES = Path(__file__).parent / "fixtures"


def test_cyberpuerta_parses_json_ld_catalog() -> None:
    listings = CyberpuertaAdapter().parse((FIXTURES / "cyberpuerta_catalog.html").read_text())
    assert len(listings) == 2
    assert listings[0].external_id == "83JG0099LM"
    assert str(listings[0].effective_price_mxn) == "24142.00"
    assert listings[1].stock_status == "out_of_stock"


def test_cyberpuerta_finds_products_inside_item_lists() -> None:
    adapter = CyberpuertaAdapter()
    products = adapter._products(
        {
            "@graph": [
                {
                    "@type": "ItemList",
                    "itemListElement": [
                        {"@type": "ListItem", "item": {"@type": "Product", "sku": "nested"}}
                    ],
                }
            ]
        }
    )
    assert products == [{"@type": "Product", "sku": "nested"}]


def test_mercadolibre_parser_uses_api_payload() -> None:
    payload = json.loads((FIXTURES / "mercadolibre_search.json").read_text())
    listings = MercadoLibreAdapter().parse(payload)
    assert len(listings) == 1
    assert listings[0].source_slug == "mercadolibre"
    assert listings[0].gpu_model == "RTX 5060"


def test_google_shopping_keeps_target_merchants_and_provenance() -> None:
    payload = json.loads((FIXTURES / "google_shopping_search.json").read_text())
    listings = GoogleShoppingAdapter().parse(payload)
    assert len(listings) == 2
    assert listings[0].source_slug == "amazon-mexico-google"
    assert listings[0].source_name == "Amazon México via Google Shopping"
    assert listings[0].gpu_model == "RTX 5060"
    assert listings[0].raw_source["provenance"] == "google_shopping_reported"
    assert listings[1].source_slug == "mercadolibre-google"


def test_google_shopping_alternates_merchants_every_six_hours() -> None:
    adapter = GoogleShoppingAdapter()
    assert adapter.search_query(datetime(2026, 8, 17, 0, tzinfo=UTC)) == "laptop Mercado Libre"
    assert adapter.search_query(datetime(2026, 8, 17, 6, tzinfo=UTC)) == "laptop Amazon México"
    assert adapter.search_query(datetime(2026, 8, 17, 12, tzinfo=UTC)) == "laptop Mercado Libre"
    assert adapter.search_query(datetime(2026, 8, 17, 18, tzinfo=UTC)) == "laptop Amazon México"


def test_writer_serializes_limited_rpc_payload() -> None:
    listing = CyberpuertaAdapter().parse((FIXTURES / "cyberpuerta_catalog.html").read_text())[0]
    writer = object.__new__(SupabaseWriter)
    payload = writer._serialize(listing)
    assert payload["effective_price_mxn"] == "24142.00"
    assert payload["product_key"]
    assert payload["configuration_key"]


def test_writer_splits_google_results_into_retailer_sources() -> None:
    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

    class FakeClient:
        def __init__(self) -> None:
            self.calls: list[dict] = []

        def post(self, path: str, json: dict) -> FakeResponse:
            self.calls.append({"path": path, "json": json})
            return FakeResponse()

    payload = json.loads((FIXTURES / "google_shopping_search.json").read_text())
    listings = GoogleShoppingAdapter().parse(payload)
    writer = object.__new__(SupabaseWriter)
    writer.ingest_token = "test-token"
    writer.client = FakeClient()

    writer.persist("Google Shopping", listings)

    assert len(writer.client.calls) == 2
    source_names = {call["json"]["p_source_name"] for call in writer.client.calls}
    assert source_names == {
        "Amazon México via Google Shopping",
        "Mercado Libre via Google Shopping",
    }
