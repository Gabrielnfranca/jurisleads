begin;

alter table if exists public.tenants enable row level security;
alter table if exists public.tenants force row level security;

alter table if exists public.leads enable row level security;
alter table if exists public.leads force row level security;

alter table if exists public.notificacoes_config enable row level security;
alter table if exists public.notificacoes_config force row level security;

alter table if exists public.faq_suggestions enable row level security;
alter table if exists public.faq_suggestions force row level security;

alter table if exists public.ab_events enable row level security;
alter table if exists public.ab_events force row level security;

revoke all on table public.tenants from anon;
revoke all on table public.leads from anon;
revoke all on table public.notificacoes_config from anon;
revoke all on table public.faq_suggestions from anon;
revoke all on table public.ab_events from anon;

revoke all on table public.tenants from authenticated;
revoke all on table public.leads from authenticated;
revoke all on table public.notificacoes_config from authenticated;
revoke all on table public.faq_suggestions from authenticated;
revoke all on table public.ab_events from authenticated;

grant select on table public.tenants to authenticated;
grant select, update, delete on table public.leads to authenticated;
grant select, insert, update on table public.notificacoes_config to authenticated;

drop policy if exists "Users can view own tenant" on public.tenants;
create policy "Users can view own tenant"
on public.tenants
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own leads" on public.leads;
create policy "Users can view own leads"
on public.leads
for select
to authenticated
using (
  exists (
    select 1
    from public.tenants
    where tenants.slug = leads.slug
      and tenants.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own leads" on public.leads;
create policy "Users can update own leads"
on public.leads
for update
to authenticated
using (
  exists (
    select 1
    from public.tenants
    where tenants.slug = leads.slug
      and tenants.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tenants
    where tenants.slug = leads.slug
      and tenants.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own leads" on public.leads;
create policy "Users can delete own leads"
on public.leads
for delete
to authenticated
using (
  exists (
    select 1
    from public.tenants
    where tenants.slug = leads.slug
      and tenants.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own config" on public.notificacoes_config;
create policy "Users can view own config"
on public.notificacoes_config
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own config"
on public.notificacoes_config
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own config"
on public.notificacoes_config
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;