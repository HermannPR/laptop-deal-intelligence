create table public.hardware_benchmark_references (
  id uuid primary key default gen_random_uuid(),
  component_type text not null check (component_type in ('cpu', 'gpu')),
  normalized_model text not null,
  benchmark_name text not null,
  benchmark_score numeric(12,2) not null check (benchmark_score > 0),
  source_label text not null,
  source_url text not null,
  last_verified_on date not null,
  limitations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (component_type, normalized_model, benchmark_name)
);

alter table public.hardware_benchmark_references enable row level security;
create policy "public read hardware benchmarks"
  on public.hardware_benchmark_references for select using (true);
grant select on public.hardware_benchmark_references to anon, authenticated;

insert into public.hardware_benchmark_references (
  component_type,
  normalized_model,
  benchmark_name,
  benchmark_score,
  source_label,
  source_url,
  last_verified_on,
  limitations
)
values
  ('gpu', 'RTX 3050', '3DMark Steel Nomad', 386, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.'),
  ('gpu', 'RTX 3060', '3DMark Steel Nomad', 1801, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.'),
  ('gpu', 'RTX 4050', '3DMark Steel Nomad', 1786, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.'),
  ('gpu', 'RTX 4060', '3DMark Steel Nomad', 2267, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.'),
  ('gpu', 'RTX 4070', '3DMark Steel Nomad', 2702, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.'),
  ('gpu', 'RTX 5050', '3DMark Steel Nomad', 2130, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.'),
  ('gpu', 'RTX 5060', '3DMark Steel Nomad', 2639, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.'),
  ('gpu', 'RTX 5070', '3DMark Steel Nomad', 3012, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.'),
  ('gpu', 'RTX 5070 Ti', '3DMark Steel Nomad', 3847, 'UL Benchmarks', 'https://benchmarks.ul.com/compare/best-gpus', '2026-08-17', 'Laptop GPU results vary with TGP, cooling, memory, and manufacturer configuration.')
on conflict (component_type, normalized_model, benchmark_name) do update set
  benchmark_score = excluded.benchmark_score,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  last_verified_on = excluded.last_verified_on,
  limitations = excluded.limitations,
  updated_at = now();

create or replace view public.listing_value_intelligence
with (security_invoker = true)
as
select
  lpi.*,
  round(extract(epoch from s.stale_after) / 3600, 2) as stale_after_hours,
  benchmark.benchmark_score as gpu_benchmark_score,
  benchmark.benchmark_name as gpu_benchmark_name,
  benchmark.source_label as gpu_benchmark_source,
  benchmark.source_url as gpu_benchmark_source_url,
  benchmark.last_verified_on as gpu_benchmark_verified_on,
  benchmark.limitations as gpu_benchmark_limitations,
  case
    when benchmark.benchmark_score is not null and lpi.effective_price_mxn > 0
      then round(benchmark.benchmark_score / (lpi.effective_price_mxn / 1000), 2)
    else null
  end as gpu_points_per_1000_mxn
from public.listing_price_intelligence lpi
join public.sources s on s.slug = lpi.source_slug
left join public.hardware_benchmark_references benchmark
  on benchmark.component_type = 'gpu'
 and benchmark.normalized_model = lpi.gpu_model;

grant select on public.listing_value_intelligence to anon, authenticated;
