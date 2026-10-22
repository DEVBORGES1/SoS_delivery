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

-- Taxas de entrega por bairro -------------------------------------------------------
-- Cada bairro atendido tem a sua taxa. Com pelo menos um bairro ativo, o cliente
-- escolhe o bairro no checkout e o banco cobra a taxa dele; sem nenhum bairro
-- ativo, vale a taxa única de store_settings.delivery_fee.
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  fee numeric(10, 2) not null default 0 check (fee >= 0 and fee <= 1000),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists delivery_zones_name_idx on public.delivery_zones (lower(trim(name)));

alter table public.delivery_zones enable row level security;

drop policy if exists "Todos leem os bairros" on public.delivery_zones;
create policy "Todos leem os bairros" on public.delivery_zones
  for select to anon, authenticated using (true);

drop policy if exists "Admins gerenciam bairros" on public.delivery_zones;
create policy "Admins gerenciam bairros" on public.delivery_zones
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

grant select on public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.delivery_zones to authenticated;

-- Promoção de entrega grátis: vale para todos os bairros enquanto estiver ligada.
-- Não mexe nas taxas cadastradas: o create_order só cobra 0 enquanto ela vale.
alter table public.store_settings
  add column if not exists free_delivery_enabled boolean not null default false,
  add column if not exists free_delivery_updated_at timestamptz;

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

-- O que foi cobrado de entrega fica gravado no pedido: mudar a taxa do bairro ou
-- a promoção depois não altera pedidos já feitos.
alter table public.orders
  add column if not exists delivery_district text not null default '' check (length(delivery_district) <= 60),
  -- Taxa cadastrada no momento do pedido (do bairro ou a taxa única); null na retirada
  add column if not exists delivery_fee_original numeric(10, 2) check (delivery_fee_original >= 0),
  add column if not exists free_delivery boolean not null default false;

-- A primeira versão devolvia só o número do pedido (bigint); trocar o tipo exige recriar.
do $$
begin
  if to_regprocedure('public.create_order(jsonb)') is not null
     and (select prorettype from pg_proc where oid = to_regprocedure('public.create_order(jsonb)')) = 'bigint'::regtype then
    drop function public.create_order(jsonb);
  end if;
end;
$$;

-- A taxa de entrega e o total são calculados aqui, com o bairro e a promoção do
-- banco; os valores de entrega mandados pelo site são ignorados. Devolve o número
-- do pedido e os valores gravados, que o site usa na mensagem do WhatsApp.
create or replace function public.create_order(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  saved public.orders;
  phone text := left(coalesce(payload ->> 'customer_phone', ''), 20);
  is_delivery boolean := payload ->> 'order_type' = 'delivery';
  wanted_district text := left(trim(coalesce(payload ->> 'district', '')), 60);
  zone_name text := '';
  original_fee numeric(10, 2);
  free_applied boolean := false;
  charged_fee numeric(10, 2) := 0;
  items_total numeric(10, 2) := (payload ->> 'subtotal')::numeric;
begin
  -- Freio contra envios em massa: no máximo 5 pedidos por telefone a cada 10 minutos.
  if (
    select count(*) from public.orders
    where customer_phone = phone and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Muitos pedidos seguidos deste telefone. Tente de novo em alguns minutos.';
  end if;

  if is_delivery then
    if exists (select 1 from public.delivery_zones where active) then
      select z.name, z.fee into zone_name, original_fee
        from public.delivery_zones z
       where z.active and lower(trim(z.name)) = lower(wanted_district);
      if not found then
        raise exception using
          message = format('Não entregamos no bairro "%s". Escolha um dos bairros atendidos.', wanted_district),
          hint = 'delivery_zone';
      end if;
    else
      select s.delivery_fee into original_fee from public.store_settings s where s.id = 1;
      original_fee := coalesce(original_fee, 0);
      zone_name := wanted_district;
    end if;
    select s.free_delivery_enabled into free_applied from public.store_settings s where s.id = 1;
    free_applied := coalesce(free_applied, false);
    charged_fee := case when free_applied then 0 else original_fee end;
  end if;

  insert into public.orders (
    customer_name, customer_phone, order_type, address, reference, payment_method,
    change_for, notes, items, subtotal, delivery_fee, total, history,
    delivery_district, delivery_fee_original, free_delivery
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
    items_total,
    charged_fee,
    items_total + charged_fee,
    jsonb_build_array(jsonb_build_object('s', 'novo', 'at', floor(extract(epoch from now()) * 1000))),
    zone_name,
    original_fee,
    free_applied
  )
  returning * into saved;

  return jsonb_build_object(
    'id', saved.id,
    'subtotal', saved.subtotal,
    'delivery_fee', saved.delivery_fee,
    'delivery_fee_original', saved.delivery_fee_original,
    'free_delivery', saved.free_delivery,
    'delivery_district', saved.delivery_district,
    'total', saved.total
  );
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

-- Impressão da comanda ------------------------------------------------------------
-- O painel aceita o pedido e manda a comanda para o agente de impressão do
-- computador da loja. As funções abaixo mudam o pedido numa única operação
-- (com a linha travada), então dois cliques ou duas abas nunca imprimem duas vezes:
--   none     → nunca foi impressa
--   printing → alguém reservou a impressão e está enviando
--   printed  → saiu na impressora
--   failed   → não saiu (o motivo fica em print_error)
alter table public.orders
  add column if not exists print_status text not null default 'none'
    check (print_status in ('none', 'printing', 'printed', 'failed')),
  add column if not exists print_error text not null default '' check (length(print_error) <= 200),
  add column if not exists print_attempts integer not null default 0,
  add column if not exists print_updated_at timestamptz,
  add column if not exists printed_at timestamptz;

-- Aceita o pedido (só se ainda estiver "novo") e, se pedido, já reserva a impressão.
-- Não devolve nada quando o pedido já tinha sido aceito: é o que barra o duplo clique.
create or replace function public.accept_order(order_id bigint, claim_print boolean)
returns setof public.orders
language sql
volatile
security invoker
set search_path = ''
as $$
  update public.orders
     set status = 'aceito',
         history = history || jsonb_build_array(
           jsonb_build_object('s', 'aceito', 'at', floor(extract(epoch from now()) * 1000))
         ),
         print_status = case when claim_print then 'printing' else print_status end,
         print_attempts = print_attempts + case when claim_print then 1 else 0 end,
         print_error = case when claim_print then '' else print_error end,
         print_updated_at = case when claim_print then now() else print_updated_at end
   where id = order_id
     and status = 'novo'
     and (select public.is_admin())
  returning *;
$$;

-- Reserva a impressão de um pedido já aceito. Só reserva se a comanda ainda não
-- saiu (ou falhou), se a reserva anterior ficou parada há mais de 2 minutos
-- (aba fechada no meio do envio) ou, com `reprint`, se o lojista pediu uma segunda via.
create or replace function public.claim_print(order_id bigint, reprint boolean)
returns setof public.orders
language sql
volatile
security invoker
set search_path = ''
as $$
  update public.orders
     set print_status = 'printing',
         print_attempts = print_attempts + 1,
         print_error = '',
         print_updated_at = now()
   where id = order_id
     and status not in ('novo', 'cancelado')
     and (
       print_status in ('none', 'failed')
       or (reprint and print_status = 'printed')
       or (print_status = 'printing' and print_updated_at < now() - interval '2 minutes')
     )
     and (select public.is_admin())
  returning *;
$$;

-- Grava o resultado da impressão reservada.
create or replace function public.finish_print(order_id bigint, success boolean, error_message text)
returns setof public.orders
language sql
volatile
security invoker
set search_path = ''
as $$
  update public.orders
     set print_status = case when success then 'printed' else 'failed' end,
         printed_at = case when success then now() else printed_at end,
         print_error = case when success then '' else left(coalesce(error_message, ''), 200) end,
         print_updated_at = now()
   where id = order_id
     and print_status = 'printing'
     and (select public.is_admin())
  returning *;
$$;

revoke all on function public.accept_order(bigint, boolean) from public, anon;
revoke all on function public.claim_print(bigint, boolean) from public, anon;
revoke all on function public.finish_print(bigint, boolean, text) from public, anon;
grant execute on function public.accept_order(bigint, boolean) to authenticated;
grant execute on function public.claim_print(bigint, boolean) to authenticated;
grant execute on function public.finish_print(bigint, boolean, text) to authenticated;

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

-- Bairros atendidos e taxas iniciais. Só entram com a tabela vazia (primeira vez):
-- depois disso quem manda é o painel, e rodar este arquivo de novo não recria
-- bairro excluído nem desfaz taxa alterada.
insert into public.delivery_zones (name, fee, sort_order)
select v.name, v.fee, v.sort_order
from (values
  ('Aeroporto', 12.00, 1),
  ('Agua Verde', 12.00, 2),
  ('Alto Boa Vista', 10.00, 3),
  ('Alvorada', 10.00, 4),
  ('Amarante', 16.00, 5),
  ('Campo Experimental', 12.00, 6),
  ('Cantu', 10.00, 7),
  ('Carboni', 15.00, 8),
  ('Carelli', 15.00, 9),
  ('Centro', 10.00, 10),
  ('Cetrevi', 20.00, 11),
  ('Cibrazem', 12.00, 12),
  ('Cidade Alta', 17.00, 13),
  ('Colina Verde', 14.00, 14),
  ('De Carli', 10.00, 15),
  ('Dois Pinheiros', 10.00, 16),
  ('Farroupilha', 12.00, 17),
  ('Floresta', 12.00, 18),
  ('Iomere', 28.00, 19),
  ('Jardim Canada', 12.00, 20),
  ('Lot. Flores', 18.00, 21),
  ('Marafom', 12.00, 22),
  ('Matriz', 10.00, 23),
  ('Menegola', 12.00, 24),
  ('Morada Do Sol', 10.00, 25),
  ('Nossa Senhora Aparecida', 12.00, 26),
  ('Oficina', 10.00, 27),
  ('Panazzolo', 12.00, 28),
  ('Poente Do Sol', 20.00, 29),
  ('Portal', 10.00, 30),
  ('Prolar', 10.00, 31),
  ('Quartel', 12.00, 32),
  ('Recanto Da Natureza', 17.00, 33),
  ('Rio Das Pedras', 22.00, 34),
  ('Santa Gema', 17.00, 35),
  ('Santa Lucia', 12.00, 36),
  ('Santa Tereza', 10.00, 37),
  ('Santos Drumont', 12.00, 38),
  ('Sesi', 12.00, 39),
  ('São Cristovão', 10.00, 40),
  ('São Francisco', 10.00, 41),
  ('Universitario', 14.00, 42),
  ('Vila Verde', 10.00, 43),
  ('Vinhedo', 10.00, 44)
) as v (name, fee, sort_order)
where not exists (select 1 from public.delivery_zones);

-- Selo que a capa já mostrava, para o lanche em destaque que ainda não tem um
-- (quem apagou o selo pelo painel fica com '' e não é afetado).
update public.products set cover_sticker = 'Blend na brasa' where featured and cover_sticker is null;
