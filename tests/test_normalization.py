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


def test_normalizes_compact_gpu_and_does_not_treat_storage_as_ram() -> None:
    specs = extract_specs("Laptop MSI RTX4050 512GB M.2 / 16GB Intel Core i7-12650H")
    assert specs["gpu_model"] == "RTX 4050"
    assert specs["ram_gb"] == 16
    assert specs["storage_gb"] == 512
    assert specs["cpu_model"] == "Intel Core i7-12650H"


def test_prefers_explicit_ram_and_storage_after_ssd_marker() -> None:
    specs = extract_specs("HP Victus RTX 4050 8GB RAM 16GB SSD 512GB Ryzen 7 8845HS")
    assert specs["ram_gb"] == 16
    assert specs["storage_gb"] == 512


def test_core_tier_does_not_consume_ram_as_a_processor_model() -> None:
    specs = extract_specs("Laptop Intel Core 5 16GB RAM 512GB SSD RTX 4050")
    assert specs["cpu_model"] is None


def test_normalizes_gpu_ti_suffix_for_benchmark_matching() -> None:
    assert extract_specs("Laptop RTX5070Ti 32GB 1TB")["gpu_model"] == "RTX 5070 Ti"


def test_canonical_key_is_stable_across_punctuation_and_case() -> None:
    assert canonical_key("Lenovo LOQ", "RTX 5060") == canonical_key("lenovo-loq", "rtx 5060")
