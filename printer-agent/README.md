# Agente de impressão (sos-impressora)

Programa pequeno que roda no computador da loja e imprime a comanda na impressora térmica
quando o pedido é aceito no painel `/admin`.

```
Painel (navegador) ──► Supabase: aceita o pedido e reserva a impressão (print_status)
        │
        └──► http://127.0.0.1:3333/print ──► agente ──► ESC/POS ──► spooler do Windows (RAW) ──► impressora USB
```

O navegador não fala com a USB: ele manda os **dados** do pedido para o agente, que monta a
comanda em ESC/POS (58mm, 32 colunas) e manda em modo RAW pelo driver já instalado no Windows.

## Uso no computador da loja

1. `npm install` e `npm run build` (aqui, no computador de desenvolvimento) geram `dist/`.
2. Copie a pasta `dist/` para o computador da loja (ex.: `C:\SOS-Impressora`) e siga o `LEIA-ME.txt`.

Arquivos criados ao lado do `.exe`: `config.json` (impressora, tabela de acentos, sites autorizados),
`impressas.json` (pedidos já impressos) e `agente.log`.

## Desenvolvimento

```bash
npm start          # agente real (Windows)
npm run simular    # impressora simulada: grava a comanda em saida-simulada/*.txt
npm test           # testes (comanda, ESC/POS, validação, servidor e cenários de falha)
npm run typecheck
npm run build      # gera dist/sos-impressora.exe (Node SEA)
```

No modo `--simular`, edite `simulador.json` com o agente rodando para simular problemas:
`"estado": "online" | "desligada" | "sem-papel" | "travada" | "removida"`.

## API (só em 127.0.0.1)

| Rota | O que faz |
| --- | --- |
| `GET /health` | `{ status: "ok", printer: "connected" \| "disconnected" \| "not_found" \| "not_configured", printerName, message, ... }` |
| `GET /printers` | Impressoras instaladas no Windows |
| `POST /config` | `{ printerName?, codepage? }` |
| `POST /print` | `{ orderId, reprint, ticket }` — `ticket` são os dados do pedido, nunca bytes prontos |
| `POST /test` | Página de teste |

Respostas de impressão: `{ ok: true, alreadyPrinted }` ou `{ ok: false, code, message }` (HTTP 503).
Códigos: `PRINTER_NOT_CONFIGURED`, `PRINTER_NOT_FOUND`, `PRINTER_OFFLINE`, `PRINTER_PAUSED`, `PAPER_OUT`,
`PRINTER_ERROR`, `PRINT_TIMEOUT`, `DRIVER_ERROR`, `SPOOLER_ERROR`.

## Segurança

- Escuta só em `127.0.0.1`: nada da rede nem da internet chega ao agente.
- Só aceita os sites de `allowedOrigins` (o resto recebe 403) e confere o `Host` (contra DNS rebinding).
- Exige `Content-Type: application/json`, então um site qualquer não consegue imprimir com um `<form>` escondido.
- Valida cada campo do pedido (tipos, tamanhos, 1 a 50 itens) e remove caracteres de controle:
  ninguém injeta comandos ESC/POS pelo nome do cliente.
- No máximo 30 impressões por minuto.

## Comanda duplicada

Duas travas independentes:

1. **Banco:** `accept_order` só aceita pedido `novo`, e `claim_print` só reserva a impressão se ela ainda não saiu
   (ou se o lojista pediu a 2ª via). Duplo clique ou duas abas: só um pedido de impressão passa.
2. **Agente:** `impressas.json` guarda os pedidos que já saíram. O mesmo pedido sem `reprint` não sai de novo, e
   pedidos iguais ao mesmo tempo viram uma impressão só.

Se a impressora não confirmar em 15 s (desligada, cabo solto), o agente **tira o trabalho da fila do Windows**.
Assim ele não sai sozinho mais tarde, somado ao "Tentar novamente".

## Limitações conhecidas

- "Sem papel" só é detectado se o driver informar ao Windows. Muitas 58mm genéricas não informam.
- Impressoras sem guilhotina ignoram o comando de corte; a comanda avança o papel para rasgar na serrilha.
- Se os acentos saírem trocados, mude a "Tabela de acentos" no painel (Loja → Impressora) e imprima um teste.
