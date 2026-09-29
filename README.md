# S.O.S Delivery Videira

Site de pedidos da hamburgueria S.O.S Delivery Videira. O cliente monta o pedido no cardápio e finaliza pelo WhatsApp.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand · React Router · Lucide React

## Rodando o projeto

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # checagem de tipos + build de produção em dist/
npm run lint     # oxlint
```

## Fluxo

Home → Cardápio → Produto (quantidade, adicionais, observação) → Carrinho → Checkout → WhatsApp → Confirmação

Nesta versão não há backend, login nem pagamento online: o pedido é enviado como mensagem formatada via `https://wa.me/`.

## Onde mudar cada coisa

| O quê | Arquivo |
| --- | --- |
| WhatsApp, Instagram, endereço, taxa de entrega, horários | `src/data/storeConfig.ts` |
| Produtos e adicionais | `src/data/products.ts` |
| Categorias (e emoji usado na mensagem) | `src/data/categories.ts` |
| Textos da home (navegação, números, grade do Instagram) | `src/data/homeContent.ts` |
| Formato da mensagem do WhatsApp | `src/utils/orderMessage.ts` |
| Cores, fontes, raios, sombras (design tokens) | `src/index.css` (`@theme`) |

Para testar o envio fora do horário de funcionamento, use `statusOverride: 'open'` em `storeConfig.ts` e volte para `'auto'` depois.

## Estrutura

```
src/
├── assets/        imagens (WebP) e fontes self-hosted
├── components/
│   ├── layout/    Header, menu mobile, Footer, banner de loja fechada, botões flutuantes
│   ├── home/      Hero, Sobre, Horário/Localização, Instagram
│   ├── menu/      filtro de categorias, cards, grade, modal do produto
│   ├── cart/      drawer, item, resumo, toast
│   ├── checkout/  formulário, entrega, pagamento, resumo, envio
│   └── ui/        Button, TextField, Dialog, Badge, QuantityStepper, RadioCard…
├── pages/         Home, Checkout, OrderConfirmation
├── data/          dados locais (produtos, categorias, configuração da loja)
├── services/      productService (catálogo) e whatsappService
├── stores/        cartStore (persistido no localStorage) e uiStore
├── hooks/         useCart, useCheckout, useCatalog, useStoreStatus…
├── types/         tipos de produto, carrinho, pedido e loja
└── utils/         moeda, máscaras, preços, validação, horários, mensagem
```

## Futura API

Os componentes não leem `data/products.ts` direto: o catálogo passa por `services/productService.ts` (`getCatalog()`, consumido via `useCatalog`). Para ligar a um backend, basta trocar a implementação de `getCatalog()` por um `fetch` à API REST — a interface não precisa mudar.

## Deploy

É uma SPA: configure o servidor para responder `index.html` em qualquer rota (senão `/checkout` dá 404 ao recarregar). Ajuste também `og:image` no `index.html` para a URL absoluta do domínio.
