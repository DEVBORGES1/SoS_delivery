-- =============================================================================
-- S.O.S Delivery Videira — banco do Supabase
--
-- Como usar: no painel do Supabase, abra "SQL Editor", cole este arquivo
-- inteiro e clique em "Run". Pode rodar de novo sem perder dados: as tabelas
-- e os dados iniciais só são criados se ainda não existirem, e as colunas
-- novas são adicionadas às tabelas que já existem. Sempre que o arquivo mudar,
-- basta rodar de novo.
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

-- Colunas adicionadas depois da primeira versão (painel completo) ---------------
alter table public.store_settings
  add column if not exists whatsapp text not null default '5549988083394' check (whatsapp ~ '^[0-9]{12,13}$'),
  add column if not exists banner_text text not null default '' check (length(banner_text) <= 90),
  add column if not exists banner_enabled boolean not null default false;

-- URL da foto enviada pelo painel (Storage); tem prioridade sobre image_key
alter table public.products add column if not exists image_url text;

-- Selo redondo sobre a foto da capa (lanche em destaque); '' = sem selo
alter table public.products
  add column if not exists cover_sticker text check (length(cover_sticker) <= 24);

-- Promoções -------------------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  -- 'percent' = desconto em %, 'price' = preço final em reais
  discount_type text not null check (discount_type in ('percent', 'price')),
  value numeric(10, 2) not null check (value > 0),
  badge text check (length(badge) <= 24),
  valid_until date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.promotions enable row level security;

drop policy if exists "Todos leem as promoções" on public.promotions;
create policy "Todos leem as promoções" on public.promotions
  for select to anon, authenticated using (true);

drop policy if exists "Admins gerenciam promoções" on public.promotions;
create policy "Admins gerenciam promoções" on public.promotions
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.promotions to anon, authenticated;
grant insert, update, delete on public.promotions to authenticated;

-- Pedidos ---------------------------------------------------------------------------
-- O site grava cada pedido pela função create_order (abaixo). Só administradores
-- leem ou alteram a tabela: nome, telefone e endereço dos clientes ficam protegidos.
create table if not exists public.orders (
  id bigint generated by default as identity (start with 1001) primary key,
  created_at timestamptz not null default now(),
  status text not null default 'novo'
    check (status in ('novo', 'aceito', 'preparando', 'saiu', 'pronto', 'concluido', 'cancelado')),
  customer_name text not null check (length(customer_name) between 1 and 80),
  customer_phone text not null check (length(customer_phone) between 8 and 20),
  order_type text not null check (order_type in ('delivery', 'pickup')),
  address text not null default '' check (length(address) <= 200),
  reference text not null default '' check (length(reference) <= 120),
  payment_method text not null check (payment_method in ('pix', 'cash', 'card')),
  change_for text not null default '' check (length(change_for) <= 20),
  notes text not null default '' check (length(notes) <= 300),
  -- [{ "name", "quantity", "addons": [..], "note", "lineTotal" }, ...]
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  -- [{ "s": "novo", "at": 1790000000000 }, ...] (at = milissegundos)
  history jsonb not null default '[]'::jsonb
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

drop policy if exists "Admins leem pedidos" on public.orders;
create policy "Admins leem pedidos" on public.orders
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins alteram pedidos" on public.orders;
create policy "Admins alteram pedidos" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Permite limpar pedidos concluídos/cancelados no fim do turno.
drop policy if exists "Admins excluem pedidos" on public.orders;
create policy "Admins excluem pedidos" on public.orders
  for delete to authenticated using ((select public.is_admin()));

grant select, update, delete on public.orders to authenticated;

create or replace function public.create_order(payload jsonb)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_id bigint;
  phone text := left(coalesce(payload ->> 'customer_phone', ''), 20);
begin
  -- Freio contra envios em massa: no máximo 5 pedidos por telefone a cada 10 minutos.
  if (
    select count(*) from public.orders
    where customer_phone = phone and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Muitos pedidos seguidos deste telefone. Tente de novo em alguns minutos.';
  end if;

  insert into public.orders (
    customer_name, customer_phone, order_type, address, reference, payment_method,
    change_for, notes, items, subtotal, delivery_fee, total, history
  ) values (
    left(trim(payload ->> 'customer_name'), 80),
    phone,
    payload ->> 'order_type',
    left(coalesce(payload ->> 'address', ''), 200),
    left(coalesce(payload ->> 'reference', ''), 120),
    payload ->> 'payment_method',
    left(coalesce(payload ->> 'change_for', ''), 20),
    left(coalesce(payload ->> 'notes', ''), 300),
    payload -> 'items',
    (payload ->> 'subtotal')::numeric,
    coalesce((payload ->> 'delivery_fee')::numeric, 0),
    (payload ->> 'total')::numeric,
    jsonb_build_array(jsonb_build_object('s', 'novo', 'at', floor(extract(epoch from now()) * 1000)))
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;

-- Pedidos novos aparecem no painel na hora (Realtime)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
     ) then
    alter publication supabase_realtime add table public.orders;
  end if;
exception
  when insufficient_privilege then
    raise notice 'Sem permissão para ligar o Realtime por SQL. Ligue em Database → Publications → supabase_realtime → orders (o painel também recarrega os pedidos a cada 30 s).';
end;
$$;

-- Fotos enviadas pelo painel (Storage) ------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- As regras das fotos ficam num bloco à parte: se o projeto não permitir criá-las
-- por aqui, o resto do arquivo é aplicado mesmo assim e aparece um aviso (NOTICE)
-- explicando como criar pelo painel do Supabase.
do $$
begin
  drop policy if exists "Admins enviam fotos" on storage.objects;
  create policy "Admins enviam fotos" on storage.objects
    for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));

  drop policy if exists "Admins alteram fotos" on storage.objects;
  create policy "Admins alteram fotos" on storage.objects
    for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));

  drop policy if exists "Admins apagam fotos" on storage.objects;
  create policy "Admins apagam fotos" on storage.objects
    for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
exception
  when insufficient_privilege then
    raise notice 'Sem permissão para criar as regras das fotos por SQL. Crie em Storage → Policies (bucket product-images): INSERT, UPDATE e DELETE para authenticated com a condição (select public.is_admin()).';
end;
$$;

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

-- Selo que a capa já mostrava, para o lanche em destaque que ainda não tem um
-- (quem apagou o selo pelo painel fica com '' e não é afetado).
update public.products set cover_sticker = 'Blend na brasa' where featured and cover_sticker is null;
