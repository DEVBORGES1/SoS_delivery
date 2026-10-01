import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CODEPAGE_IDS, encodeText, normalizeForCodepage } from '../src/codepages.ts';
import { buildOrderTicket, buildTestTicket, formatMoney } from '../src/comanda.ts';
import { escPosToText, wrap } from '../src/escpos.ts';
import { deliveryTicket, pickupTicket } from './fixtures.ts';

const layout = { columns: 32, codepage: 'cp850' as const };

function assertFits(doc: ReturnType<typeof buildOrderTicket>) {
  for (const line of doc.lines) {
    assert.ok(line.text.length <= doc.width(line.size), `linha passa da largura (${line.size}): "${line.text}"`);
  }
}

describe('quebra de linha', () => {
  it('não corta palavras e respeita a largura', () => {
    const lines = wrap('Ponto da carne bem passado com bastante queijo derretido', 16);
    assert.ok(lines.every((line) => line.length <= 16));
    assert.equal(lines.join(' '), 'Ponto da carne bem passado com bastante queijo derretido');
  });

  it('corta só a palavra que não cabe sozinha', () => {
    assert.deepEqual(wrap('ABCDEFGHIJKLMNOPQRST', 8), ['ABCDEFGH', 'IJKLMNOP', 'QRST']);
  });

  it('recua as linhas seguintes', () => {
    assert.deepEqual(wrap('2x HAMBURGUER ARTESANAL DUPLO', 16, '   '), ['2x HAMBURGUER', '   ARTESANAL', '   DUPLO']);
  });

  it('texto vazio vira uma linha vazia', () => {
    assert.deepEqual(wrap('', 32), ['']);
  });

  it('recuo próprio na primeira linha', () => {
    assert.deepEqual(wrap('OBS: sem cebola e sem tomate', 16, '    ', '  '), ['  OBS: sem', '    cebola e sem', '    tomate']);
  });
});

describe('acentos', () => {
  for (const codepage of CODEPAGE_IDS.filter((id) => id !== 'ascii')) {
    it(`ida e volta sem perder letras em ${codepage}`, () => {
      const text = 'ÁÉÍÓÚ ÂÊÔ ÃÕ Ç áéíóú âêô ãõ ç Nº 1ª';
      const doc = buildTestTicket('POS-58', { columns: 32, codepage });
      const printed = escPosToText(doc.toEscPos({ feedLines: 0, cut: false }), codepage);
      assert.match(printed, /ÁÉÍÓÚ ÂÊÔ ÃÕ Ç/);
      assert.match(printed, /áéíóú âêô ãõ ç/);
      assert.equal(normalizeForCodepage(text, codepage), text);
    });
  }

  it('sem tabela, tira o acento em vez de imprimir lixo', () => {
    assert.equal(normalizeForCodepage('Pão com Maçã', 'ascii'), 'Pao com Maca');
    assert.deepEqual([...encodeText('ç', 'ascii')], [0x63]);
  });

  it('remove emojis e troca travessão', () => {
    assert.equal(normalizeForCodepage('🍔 X-Bacon — duplo ❤️', 'cp850'), ' X-Bacon - duplo ');
  });
});

describe('comanda do pedido', () => {
  it('pedido de entrega com adicionais e observações', () => {
    const doc = buildOrderTicket(deliveryTicket(), layout);
    const text = doc.toText();
    assertFits(doc);
    for (const expected of [
      'S.O.S DELIVERY VIDEIRA',
      'PEDIDO #1025',
      'DATA: 30/09/2026',
      'HORA: 18:42',
      'ENTREGA',
      'João Vitor',
      'Tel: (49) 99999-8888',
      '2x X-BACON',
      '+ Bacon',
      '+ Cheddar',
      'OBS: Sem cebola',
      '1x COMBATE DUPLO',
      'OBS: Ponto da carne bem',
      '1x BATATA FRITA',
      'R$ 89,70',
      'PIX',
      'ENDEREÇO:',
      'Rua Exemplo, 123 - Centro (Apto',
      'Ref: Casa azul',
      'Videira - SC',
      'OBSERVAÇÃO:',
      'Entregar na frente da casa.',
      'PEDIDO ACEITO',
      'Aceito às 18:45',
    ]) {
      assert.ok(text.includes(expected), `faltou "${expected}" na comanda:\n${text}`);
    }
    assert.ok(!text.includes('REIMPRESSÃO'));

    // Valores alinhados à direita e adicionais recuados.
    const lines = text.split('\n');
    assert.ok(lines.includes('DATA: 30/09/2026     HORA: 18:42'), 'data e hora nas pontas');
    assert.ok(lines.includes(`TOTAL${' '.repeat(19)}R$ 89,70`), 'total alinhado à direita');
    assert.ok(lines.includes('  + Bacon'), 'adicional recuado');
    assert.ok(lines.includes('  OBS: Ponto da carne bem'), 'observação recuada');
    assert.ok(lines.includes('    passado'), 'continuação da observação recuada');
  });

  it('pedido de retirada não tem endereço nem taxa, e mostra o troco', () => {
    const text = buildOrderTicket(pickupTicket(), layout).toText();
    assert.ok(text.includes('RETIRADA'));
    assert.ok(!text.includes('ENDEREÇO'));
    assert.ok(!text.includes('Entrega '));
    assert.ok(text.includes('DINHEIRO'));
    assert.ok(text.includes('Troco para: R$ 100,00'));
    assert.ok(!text.includes('OBSERVAÇÃO'));
  });

  it('muitos produtos continuam dentro da largura', () => {
    const items = Array.from({ length: 50 }, (_, index) => ({
      quantity: (index % 9) + 1,
      name: `Lanche especial número ${index + 1} com nome comprido demais para uma linha`,
      addons: ['Bacon extra', 'Cheddar cremoso', 'Ovo'],
      note: index % 2 ? 'Sem cebola, sem tomate e com bastante molho da casa' : '',
    }));
    const doc = buildOrderTicket(deliveryTicket({ items }), layout);
    assertFits(doc);
    const text = doc.toText();
    assert.ok(text.includes('50X') === false && text.includes('5x LANCHE ESPECIAL'));
    assert.equal((text.match(/\+ Bacon extra/g) ?? []).length, 50);
  });

  it('segunda via vem marcada', () => {
    assert.ok(buildOrderTicket(deliveryTicket(), { ...layout, reprint: true }).toText().includes('2ª VIA - REIMPRESSÃO'));
  });

  it('bytes ESC/POS: inicia, sai do modo chinês, escolhe a tabela, avança e corta', () => {
    const data = buildOrderTicket(deliveryTicket(), layout).toEscPos({ feedLines: 4, cut: true });
    assert.deepEqual([...data.subarray(0, 7)], [0x1b, 0x40, 0x1c, 0x2e, 0x1b, 0x74, 2]);
    assert.deepEqual([...data.subarray(-7)], [0x1b, 0x64, 4, 0x1d, 0x56, 0x42, 0x00]);
    assert.ok(data.includes(Buffer.from([0x1d, 0x21, 0x11])), 'usa letra grande');
    assert.ok(data.includes(Buffer.from([0x1b, 0x45, 1])), 'usa negrito');
    assert.ok(!data.includes(Buffer.from('João', 'utf8')), 'não manda UTF-8 cru');
  });

  it('formata dinheiro', () => {
    assert.equal(formatMoney(89.7), 'R$ 89,70');
    assert.equal(formatMoney(1234.5), 'R$ 1.234,50');
    assert.equal(formatMoney(0), 'R$ 0,00');
  });
});
