-- Armazena overrides de copy/perguntas por slug e variante (A/B)
create table if not exists public.landing_template_variants (
  slug text not null,
  variant text not null check (variant in ('A', 'B')),
  overrides jsonb not null default '{}'::jsonb,
  source text not null default 'manual',
  updated_by text,
  updated_at timestamptz not null default now(),
  constraint landing_template_variants_pk primary key (slug, variant)
);

create index if not exists landing_template_variants_slug_idx
  on public.landing_template_variants (slug);

alter table public.landing_template_variants enable row level security;
alter table public.landing_template_variants force row level security;

revoke all on table public.landing_template_variants from anon, authenticated;
