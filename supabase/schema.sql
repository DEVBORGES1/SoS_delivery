-- =============================================================================
-- S.O.S Delivery Videira — banco do Supabase
--
-- Como usar: no painel do Supabase, abra "SQL Editor", cole este arquivo
-- inteiro e clique em "Run". Pode rodar de novo sem perder dados: as tabelas
-- e os dados iniciais só são criados se ainda não existirem.
--
-- Depois, crie o seu usuário em Authentication → Users → "Add user" e rode
-- (trocando o e-mail):
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'seu-email@exemplo.com';
-- =============================================================================

-- Quem pode editar pelo painel /admin ------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Configurações da loja (uma linha só) -----------------------------------------
create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  status_override text not null default 'auto' check (status_override in ('auto', 'open', 'closed')),
  -- [{ "day": 0-6 (0 = domingo), "opensAt": 19, "closesAt": 23 }, ...]; null = fechado
  weekly_hours jsonb not null,
  delivery_enabled boolean not null default true,
  pickup_enabled boolean not null default true,
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  delivery_eta text not null default '~40 min',
  pickup_eta text not null default '~20 min',
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

drop policy if exists "Todos leem as configurações" on public.store_settings;
create policy "Todos leem as configurações" on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists "Admins criam as configurações" on public.store_settings;
create policy "Admins criam as configurações" on public.store_settings
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "Admins alteram as configurações" on public.store_settings;
create policy "Admins alteram as configurações" on public.store_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Cardápio ----------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  category_id text not null,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  price numeric(10, 2) not null default 0 check (price >= 0),
  -- chave da foto em src/data/productImages.ts
  image_key text,
  image_position text,
  badge text,
  available boolean not null default true,
  featured boolean not null default false,
  -- [{ "id": "bacon", "name": "Bacon", "price": 5 }, ...]
  addons jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Todos leem o cardápio" on public.products;
create policy "Todos leem o cardápio" on public.products
  for select to anon, authenticated using (true);

drop policy if exists "Admins criam itens" on public.products;
create policy "Admins criam itens" on public.products
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "Admins alteram itens" on public.products;
create policy "Admins alteram itens" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins excluem itens" on public.products;
create policy "Admins excluem itens" on public.products
  for delete to authenticated using ((select public.is_admin()));

grant select on public.store_settings, public.products to anon, authenticated;
grant insert, update on public.store_settings to authenticated;
grant insert, update, delete on public.products to authenticated;

-- Ping diário (evita a pausa do plano grátis) ----------------------------------
-- Chamado pelo GitHub Action .github/workflows/supabase-keepalive.yml.
create table if not exists public.keepalive (
  id smallint primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now()
);

-- Sem políticas: ninguém acessa a tabela direto, só pela função abaixo.
alter table public.keepalive enable row level security;

create or replace function public.keepalive()
returns timestamptz
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.keepalive (id, pinged_at) values (1, now())
  on conflict (id) do update set pinged_at = excluded.pinged_at
  returning pinged_at;
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;

-- Dados iniciais -----------------------------------------------------------------
insert into public.store_settings (id, weekly_hours)
values (
  1,
  '[
    {"day": 1, "opensAt": null, "closesAt": null},
    {"day": 2, "opensAt": null, "closesAt": null},
    {"day": 3, "opensAt": 19, "closesAt": 23},
    {"day": 4, "opensAt": 19, "closesAt": 23},
    {"day": 5, "opensAt": 19, "closesAt": 23},
    {"day": 6, "opensAt": 19, "closesAt": 23},
    {"day": 0, "opensAt": 19, "closesAt": 23}
  ]'::jsonb
)
on conflict (id) do nothing;

-- Preços em 0 e itens indisponíveis: defina os preços pelo painel /admin.
insert into public.products
  (id, category_id, name, description, price, image_key, image_position, badge, available, featured, sort_order)
values
  ('brigada-da-fome', 'burgers', 'Brigada da Fome',
   'Frango empanado super crocante, cheddar cremoso, alface e pão brioche.',
   0, 'brigada-da-fome', '50% 62%', null, false, false, 0),
  ('combate-duplo', 'burgers', 'Combate Duplo',
   'Dois blends artesanais, queijo coalho na chapa, maionese da casa, alface e pão brioche.',
   0, 'combate-duplo', '50% 62%', 'Duplo', false, true, 1),
  ('sos-bravo', 'burgers', 'SOS Bravo',
   'Blend artesanal, queijo derretido, ovo, alface, tomate e maionese verde no pão brioche.',
   0, 'sos-bravo', '50% 66%', null, false, false, 2),
  ('linha-de-frente', 'burgers', 'Linha de Frente',
   'Descrição em breve.',
   0, null, null, null, false, false, 3),
  ('batata-bacon-cheddar', 'porcoes', 'Batata, Bacon e Cheddar',
   'Batata frita coberta com cheddar cremoso e bacon crocante.',
   0, 'batata-bacon-cheddar', '50% 70%', null, false, false, 4),
  ('operacao-crocante', 'porcoes', 'Operação Crocante',
   'Carne em tiras acebolada com pimentão, batata frita e mandioca frita.',
   0, 'operacao-crocante', '50% 75%', null, false, false, 5),
  ('resgate-rapido', 'porcoes', 'Resgate Rápido',
   'Frango empanado, polenta frita e batata frita, com limão e molhos.',
   0, 'resgate-rapido', '50% 60%', null, false, false, 6),
  ('resgate-em-equipe', 'porcoes', 'Resgate em Equipe',
   'Tiras de frango empanadas, polenta frita e batata frita.',
   0, 'resgate-em-equipe', '50% 60%', null, false, false, 7),
  ('resgate-do-pescador', 'porcoes', 'Resgate do Pescador',
   'Peixe e camarão empanados, polenta frita e batata frita, com limão e molho tártaro.',
   0, 'resgate-do-pescador', '50% 70%', null, false, false, 8),
  ('resgate-supremo', 'porcoes', 'Resgate Supremo',
   'Tiras de frango empanadas e batata frita crocante.',
   0, 'resgate-supremo', '50% 72%', null, false, false, 9)
on conflict (id) do nothing;
