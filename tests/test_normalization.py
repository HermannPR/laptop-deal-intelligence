from decimal import Decimal

from collector.normalization.specs import canonical_key, extract_specs, parse_price


def test_parse_mexican_price_formats() -> None:
    assert parse_price("$23,999.00 MXN") == Decimal("23999.00")
    assert parse_price("Gratis") == Decimal("0")


def test_extracts_core_specs_without_inventing_missing_fields() -> None:
    specs = extract_specs('Lenovo LOQ Ryzen 7 250 RTX 5060 16GB 1TB SSD 15.6" 1920x1080')
    assert specs["gpu_model"] == "RTX 5060"
    assert specs["ram_gb"] == 16
    assert specs["storage_gb"] == 1024
    assert specs["resolution"] == "1920x1080"


def test_canonical_key_is_stable_across_punctuation_and_case() -> None:
    assert canonical_key("Lenovo LOQ", "RTX 5060") == canonical_key("lenovo-loq", "rtx 5060")
