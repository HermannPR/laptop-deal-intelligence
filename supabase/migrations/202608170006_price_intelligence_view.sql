create or replace view public.listing_price_intelligence
with (security_invoker = true)
as
with sequenced as (
  select
    po.*,
    lag(po.effective_price_mxn) over (
      partition by po.listing_id order by po.observed_at, po.id
    ) as previous_price_mxn
  from public.price_observations po
),
stats as (
  select
    listing_id,
    round(avg(effective_price_mxn) filter (
      where observed_at >= now() - interval '7 days'
    ), 2) as average_7d_mxn,
    round(avg(effective_price_mxn) filter (
      where observed_at >= now() - interval '30 days'
    ), 2) as average_30d_mxn,
    round(avg(effective_price_mxn) filter (
      where observed_at >= now() - interval '90 days'
    ), 2) as average_90d_mxn,
    min(effective_price_mxn) as historical_min_mxn,
    max(effective_price_mxn) as historical_max_mxn,
    count(*)::integer as observation_count,
    count(distinct observed_at::date)::integer as observed_days,
    count(*) filter (
      where previous_price_mxn is not null
        and previous_price_mxn <> effective_price_mxn
    )::integer as price_change_count,
    min(observed_at) as first_observed_at,
    max(observed_at) as last_observed_at
  from sequenced
  group by listing_id
),
latest as (
  select distinct on (listing_id)
    listing_id,
    price_mxn,
    shipping_mxn,
    effective_price_mxn,
    stock_status,
    raw_source,
    observed_at
  from public.price_observations
  order by listing_id, observed_at desc, id desc
)
select
  l.id,
  l.configuration_id,
  s.slug as source_slug,
  s.display_name as store_name,
  l.seller,
  l.title,
  cp.brand,
  pc.model_number,
  pc.cpu_model,
  pc.gpu_model,
  pc.gpu_vram_gb,
  pc.ram_gb,
  pc.storage_gb,
  concat_ws(
    ' · ',
    case when pc.screen_size_inches is not null then pc.screen_size_inches || '″' end,
    pc.resolution
  ) as screen_summary,
  latest.price_mxn as current_price_mxn,
  latest.shipping_mxn,
  latest.effective_price_mxn,
  l.product_url,
  latest.observed_at,
  latest.stock_status,
  stats.average_7d_mxn,
  stats.average_30d_mxn,
  stats.average_90d_mxn,
  stats.historical_min_mxn,
  stats.historical_max_mxn,
  stats.observation_count,
  stats.observed_days,
  stats.price_change_count,
  stats.first_observed_at,
  stats.last_observed_at,
  round(extract(epoch from (stats.last_observed_at - stats.first_observed_at)) / 86400, 2)
    as history_span_days,
  case
    when coalesce(latest.raw_source->>'provenance', '') = 'google_shopping_reported'
      then 'google_reported'
    else 'direct'
  end as data_provenance
from public.listings l
join public.sources s on s.id = l.source_id
left join public.product_configurations pc on pc.id = l.configuration_id
left join public.canonical_products cp on cp.id = pc.product_id
join latest on latest.listing_id = l.id
join stats on stats.listing_id = l.id;

grant select on public.listing_price_intelligence to anon, authenticated;
