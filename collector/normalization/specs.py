from __future__ import annotations

import hashlib
import re
import unicodedata
from decimal import Decimal

GPU_PATTERN = re.compile(
    r"(?:NVIDIA\s+)?(?:GeForce\s+)?(RTX\s*\d{4}(?:\s*Ti)?|GTX\s*\d{4}(?:\s*Ti)?)",
    re.IGNORECASE,
)
RAM_PATTERN = re.compile(r"(?<!\d)(\d{1,3})\s*GB", re.IGNORECASE)
EXPLICIT_RAM_PATTERNS = (
    re.compile(r"(?:RAM|MEMORIA(?:\s+RAM)?)(?:\s+DE)?\s*:?\s*(\d{1,3})\s*GB", re.IGNORECASE),
    re.compile(
        r"(?<!\d)(\d{1,3})\s*GB(?:\s*DDR[345](?:X)?)?\s*(?:DE\s+)?RAM\b",
        re.IGNORECASE,
    ),
)
STORAGE_PREFIX_PATTERN = re.compile(
    r"(?:SSD|NVMe|M\.2)\s*:?\s*(\d+(?:\.\d+)?)\s*(TB|GB)", re.IGNORECASE
)
STORAGE_SUFFIX_PATTERN = re.compile(
    r"(?<!\d)(\d+(?:\.\d+)?)\s*(TB|GB)\s*(?:SSD|NVMe|M\.2)", re.IGNORECASE
)
STORAGE_TB_PATTERN = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)\s*(TB)(?!\w)", re.IGNORECASE)
SCREEN_PATTERN = re.compile(r"(\d{2}(?:\.\d)?)\s*(?:\"|pulgadas|pulg)", re.IGNORECASE)
RESOLUTION_PATTERN = re.compile(r"(?<!\d)(\d{3,4})\s*[x×]\s*(\d{3,4})(?!\d)", re.IGNORECASE)
CPU_PATTERN = re.compile(
    r"((?:AMD\s+)?Ryzen\s+(?:AI\s+)?[3579](?:\s+PRO)?\s+(?:[A-Z]{1,3}\s*)?\d{3,5}[A-Z]{0,3}|"
    r"(?:Intel\s+)?Core\s+(?:Ultra\s+)?(?:i[3579][\s-]?\d{4,5}[A-Z]{0,3}|"
    r"[3579]\s+\d{3,5}[A-Z]{0,3}))",
    re.IGNORECASE,
)


def clean_text(value: str) -> str:
    return " ".join(value.replace("™", "").replace("®", "").split())


def parse_price(value: str | int | float | Decimal | None) -> Decimal:
    if value is None:
        return Decimal("0")
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))
    normalized = value.replace("MXN", "").replace("$", "").replace(",", "").strip()
    if not normalized or normalized.casefold() in {"gratis", "free"}:
        return Decimal("0")
    match = re.search(r"\d+(?:\.\d+)?", normalized)
    return Decimal(match.group(0)) if match else Decimal("0")


def extract_specs(title: str) -> dict[str, object | None]:
    title = clean_text(title)
    gpu = GPU_PATTERN.search(title)
    cpu = CPU_PATTERN.search(title)
    ram_values = [int(match.group(1)) for match in RAM_PATTERN.finditer(title)]
    storage = (
        STORAGE_PREFIX_PATTERN.search(title)
        or STORAGE_SUFFIX_PATTERN.search(title)
        or STORAGE_TB_PATTERN.search(title)
    )
    screen = SCREEN_PATTERN.search(title)
    resolution = RESOLUTION_PATTERN.search(title)

    storage_gb = None
    if storage:
        amount = Decimal(storage.group(1))
        unit = storage.group(2)
        storage_gb = int(amount * (1024 if unit.upper() == "TB" else 1))

    explicit_ram = next(
        (match for pattern in EXPLICIT_RAM_PATTERNS if (match := pattern.search(title))),
        None,
    )
    # Exclude common storage capacities and prefer the largest plausible value when titles
    # contain both system memory and GPU VRAM.
    plausible_ram = [value for value in ram_values if 8 <= value <= 128]
    ram_gb = int(explicit_ram.group(1)) if explicit_ram else max(plausible_ram, default=None)

    gpu_model = None
    if gpu:
        gpu_model = re.sub(r"^(RTX|GTX)\s*", r"\1 ", clean_text(gpu.group(1).upper()))
        gpu_model = re.sub(r"\s*TI$", " Ti", gpu_model)
    return {
        "cpu_model": clean_text(cpu.group(1)) if cpu else None,
        "gpu_model": gpu_model,
        "ram_gb": ram_gb,
        "storage_gb": storage_gb,
        "screen_size_inches": Decimal(screen.group(1)) if screen else None,
        "resolution": f"{resolution.group(1)}x{resolution.group(2)}" if resolution else None,
    }


def normalize_brand(title: str) -> str | None:
    brands = ("Lenovo", "ASUS", "Acer", "HP", "Dell", "MSI", "Gigabyte", "Alienware")
    folded = title.casefold()
    return next((brand for brand in brands if brand.casefold() in folded), None)


def canonical_key(*parts: object | None) -> str:
    raw = "|".join(normalize_token(str(part)) for part in parts if part not in (None, ""))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def normalize_token(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")
