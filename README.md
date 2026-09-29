# S.O.S Delivery Videira

Site de pedidos da hamburgueria S.O.S Delivery Videira. O cliente monta o pedido no cardápio e finaliza pelo WhatsApp.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand · React Router · Lucide React · Supabase

## Rodando o projeto

```bash
npm install
cp .env.example .env   # preencha com os dados do Supabase (opcional)
npm run dev            # desenvolvimento em http://localhost:5173
npm run build          # checagem de tipos + build de produção em dist/
npm run lint           # oxlint
```

Sem o `.env`, o site funciona só com os dados do código (`src/data/`).

## Fluxo

Home → Cardápio → Produto (quantidade, adicionais, observação) → Carrinho → Checkout → WhatsApp → Confirmação

Não há pagamento online: o pedido é enviado como mensagem formatada via `https://wa.me/`.

## Painel da loja (`/admin`)

Em `/admin`, com e-mail e senha, a loja altera sem mexer no código:

- **Loja e horários:** abrir/fechar na hora (folga, feriado), horário de cada dia, entrega/retirada, taxa e tempos.
- **Cardápio:** preço, descrição, selo, foto, adicionais, disponível/esgotado, ordem dos itens, novos itens e exclusão.

Os dados ficam no Supabase. O site lê o banco uma vez por visita; se o banco não responder em 5 s, usa os dados do código.

### Configurar o Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. Em **SQL Editor**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**. Isso cria as tabelas, as regras de segurança e o cardápio inicial.
3. Em **Authentication → Users → Add user**, crie o usuário da loja (marque *Auto Confirm User*).
4. De volta ao **SQL Editor**, libere esse usuário como administrador:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'seu-email@exemplo.com';
   ```
5. Em **Authentication → Sign In / Providers**, desative *Allow new users to sign up* (só a loja entra no painel).
6. Em **Project Settings → API**, copie a *Project URL* e a chave *anon public* para o `.env` (local) e para as variáveis de ambiente da hospedagem (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`). Publique o site de novo.

### Ping diário (evita a pausa do plano grátis)

O plano grátis do Supabase pausa o projeto após 7 dias sem uso. O workflow [`.github/workflows/supabase-keepalive.yml`](.github/workflows/supabase-keepalive.yml) grava no banco todo dia às 08:17 (Brasília) para evitar isso.

1. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**, crie `SUPABASE_URL` e `SUPABASE_ANON_KEY` (os mesmos valores do `.env`).
2. Teste em **Actions → Supabase keep-alive → Run workflow**.

O agendamento só roda a partir da branch `main`. O GitHub desativa agendamentos de repositórios públicos sem commits por 60 dias e avisa por e-mail; se isso acontecer, reative em **Actions**.

## Onde mudar cada coisa

| O quê | Onde |
| --- | --- |
| Horários, abrir/fechar, entrega, preços, disponibilidade, adicionais | Painel `/admin` |
| WhatsApp, Instagram, endereço | `src/data/storeConfig.ts` (`storeConfig`) |
| Horários e entrega padrão (sem Supabase) | `src/data/storeConfig.ts` (`defaultStoreSettings`) |
| Cardápio padrão (sem Supabase) | `src/data/products.ts` |
| Fotos disponíveis para os produtos | `src/data/productImages.ts` + arquivo em `src/assets/images/` |
| Categorias (e emoji usado na mensagem) | `src/data/categories.ts` |
| Textos da home (navegação, números, grade do Instagram) | `src/data/homeContent.ts` |
| Formato da mensagem do WhatsApp | `src/utils/orderMessage.ts` |
| Cores, fontes, raios, sombras (design tokens) | `src/index.css` (`@theme`) |

## Estrutura

```
src/
├── assets/        imagens (WebP) e fontes self-hosted
├── components/
│   ├── admin/     painel: configurações da loja, lista e formulário de produtos
│   ├── layout/    Header, menu mobile, Footer, banner de loja fechada, botões flutuantes
│   ├── home/      Hero, Sobre, Horário/Localização, Instagram
│   ├── menu/      filtro de categorias, cards, grade, modal do produto
│   ├── cart/      drawer, item, resumo, toast
│   ├── checkout/  formulário, entrega, pagamento, resumo, envio
│   └── ui/        Button, TextField, Dialog, Badge, QuantityStepper, RadioCard…
├── pages/         Home, Checkout, OrderConfirmation, Admin
├── data/          dados locais (produtos, fotos, categorias, configuração da loja)
├── services/      productService (catálogo + configurações), Supabase, whatsappService
├── stores/        cartStore (persistido no localStorage), settingsStore e uiStore
├── hooks/         useCart, useCheckout, useCatalog, useStoreSettings, useStoreStatus…
├── types/         tipos de produto, carrinho, pedido e loja
└── utils/         moeda, máscaras, preços, validação, horários, mensagem
supabase/          schema.sql (tabelas, regras de segurança, dados iniciais)
```

O site dos clientes lê o Supabase por `fetch` simples (`services/productService.ts`); o SDK completo do Supabase só é baixado em `/admin`.

## Deploy

É uma SPA: configure o servidor para responder `index.html` em qualquer rota (senão `/checkout` e `/admin` dão 404 ao recarregar). Ajuste também `og:image` no `index.html` para a URL absoluta do domínio.
