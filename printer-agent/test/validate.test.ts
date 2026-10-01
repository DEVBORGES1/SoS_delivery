import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ValidationError, parsePrintRequest } from '../src/validate.ts';
import { deliveryTicket } from './fixtures.ts';

const valid = () => ({ orderId: 1025, ticket: deliveryTicket() as unknown as Record<string, unknown> });

describe('validação do POST /print', () => {
  it('aceita um pedido válido (orderId pode vir como texto)', () => {
    const request = parsePrintRequest({ ...valid(), orderId: '1025' });
    assert.equal(request.orderId, 1025);
    assert.equal(request.reprint, false);
    assert.equal(request.ticket.items.length, 3);
  });

  const invalid: [string, (body: ReturnType<typeof valid>) => unknown][] = [
    ['corpo que não é objeto', () => 'imprimir tudo'],
    ['sem comanda', (body) => ({ orderId: body.orderId })],
    ['comanda em texto livre', (body) => ({ ...body, ticket: '\x1b@ESC/POS cru' })],
    ['número diferente do pedido', (body) => ({ ...body, orderId: 999 })],
    ['número negativo', (body) => ({ ...body, orderId: -1 })],
    ['sem itens', (body) => ({ ...body, ticket: { ...body.ticket, items: [] } })],
    ['itens demais', (body) => ({ ...body, ticket: { ...body.ticket, items: Array(51).fill({ quantity: 1, name: 'X' }) } })],
    ['quantidade quebrada', (body) => ({ ...body, ticket: { ...body.ticket, items: [{ quantity: 1.5, name: 'X' }] } })],
    ['nome enorme', (body) => ({ ...body, ticket: { ...body.ticket, customerName: 'a'.repeat(81) } })],
    ['tipo desconhecido', (body) => ({ ...body, ticket: { ...body.ticket, orderType: 'drone' } })],
    ['pagamento desconhecido', (body) => ({ ...body, ticket: { ...body.ticket, paymentMethod: 'bitcoin' } })],
    ['total negativo', (body) => ({ ...body, ticket: { ...body.ticket, total: -5 } })],
    ['data absurda', (body) => ({ ...body, ticket: { ...body.ticket, createdAt: 12 } })],
    ['reprint que não é booleano', (body) => ({ ...body, reprint: 'sim' })],
  ];
  for (const [name, build] of invalid) {
    it(`recusa: ${name}`, () => {
      assert.throws(() => parsePrintRequest(build(valid())), ValidationError);
    });
  }

  it('limpa caracteres de controle (não deixa injetar comandos ESC/POS)', () => {
    const body = valid();
    const request = parsePrintRequest({ ...body, ticket: { ...body.ticket, notes: 'ok\x1b\x1dV\x00 fim' } });
    assert.equal(request.ticket.notes, 'okV fim');
  });
});
