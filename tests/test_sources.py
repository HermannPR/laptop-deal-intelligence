import json
from pathlib import Path

from collector.sources.cyberpuerta import CyberpuertaAdapter
from collector.sources.mercadolibre import MercadoLibreAdapter

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
