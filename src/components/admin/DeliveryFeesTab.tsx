import { useState } from 'react';
import type { DeliveryZone } from '../../types/store';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import { parsePrice, priceToInput } from './adminFormat';
import {
  BTN_PRIMARY,
  CARD,
  CARD_PAD,
  ConfirmButton,
  ConfirmDialog,
  EYEBROW,
  Field,
  INPUT,
  MUTED,
  PrefixedInput,
  Segmented,
  Switch,
} from './adminUi';
import { useCommitField } from './useCommitField';
import type { AdminData } from './useAdminData';

function feeLabel(fee: number): string {
  return fee ? formatCurrency(fee) : 'Grátis';
}

/** "1 bairro ativo" / "3 bairros ativos". */
function activeZonesLabel(count: number): string {
  return count === 1 ? '1 bairro ativo' : `${count} bairros ativos`;
}

interface FreeDeliveryCardProps {
  data: AdminData;
  activeCount: number;
}

/** Liga/desliga a entrega grátis para todos os bairros, sempre com confirmação. */
function FreeDeliveryCard({ data, activeCount }: FreeDeliveryCardProps) {
  const { settings, saving, setFreeDelivery } = data;
  const on = settings.freeDeliveryEnabled;
  const [asking, setAsking] = useState<boolean | null>(null);

  const request = (enabled: boolean) => {
    if (enabled !== on) setAsking(enabled);
  };
  const confirm = async () => {
    if (asking === null) return;
    if (await setFreeDelivery(asking)) setAsking(null);
  };

  return (
    <section
      aria-labelledby="free-delivery-title"
      className={cn(CARD, CARD_PAD, 'border-2', on ? 'border-[#178a45]' : 'border-[#f2b53a]')}
    >
      <div className={EYEBROW}>PROMOÇÃO</div>
      <h2
        id="free-delivery-title"
        className="mt-1 mb-0 font-display text-[clamp(24px,3vw,30px)] leading-[1.1] font-normal uppercase"
      >
        Promoção de entrega grátis
      </h2>
      <p className={cn('mt-1.5 mb-0 max-w-[560px] text-sm', MUTED)}>
        Ative a entrega grátis para todos os bairros atendidos pela hamburgueria, sem precisar alterar individualmente
        os preços cadastrados.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-(--adm-divider) pt-4">
        <span id="free-delivery-label" className="text-[15px] font-extrabold">
          Entrega grátis para todos os bairros
        </span>
        <Segmented
          ariaLabel="Entrega grátis para todos os bairros"
          value={on ? 'on' : 'off'}
          onChange={(id) => request(id === 'on')}
          options={[
            { id: 'off', label: 'DESATIVADA' },
            { id: 'on', label: 'ATIVADA' },
          ]}
          className="min-w-[260px] max-[419px]:w-full max-[419px]:min-w-0"
        />
      </div>

      {on ? (
        <div
          role="status"
          className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[14px] bg-[#178a45] px-5 py-4 text-white"
        >
          <div>
            <div className="font-display text-[26px] leading-none tracking-[.02em]">PROMOÇÃO ATIVA</div>
            <p className="mt-1.5 mb-0 text-sm leading-snug font-semibold">
              Entrega grátis para todos os bairros.
              <br />
              Taxas individuais preservadas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => request(false)}
            disabled={saving}
            className="h-12 cursor-pointer rounded-xl bg-white px-5 text-sm font-extrabold tracking-[.04em] text-[#10331d] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            DESATIVAR PROMOÇÃO
          </button>
        </div>
      ) : (
        <div role="status" className="mt-4 rounded-[14px] bg-(--adm-soft) px-5 py-4">
          <div className="font-display text-[22px] leading-none tracking-[.02em]">PROMOÇÃO DESATIVADA</div>
          <p className={cn('mt-1.5 mb-0 text-sm', MUTED)}>O checkout cobra a taxa cadastrada para cada bairro.</p>
        </div>
      )}

      {asking !== null && (
        <ConfirmDialog
          title={asking ? 'Ativar entrega grátis?' : 'Desativar entrega grátis?'}
          confirmLabel={asking ? 'ATIVAR ENTREGA GRÁTIS' : 'DESATIVAR PROMOÇÃO'}
          tone={asking ? 'success' : 'danger'}
          busy={saving}
          onConfirm={() => void confirm()}
          onCancel={() => setAsking(null)}
        >
          {asking ? (
            <>
              A partir de agora, os pedidos novos de entrega
              {activeCount ? ` nos ${activeZonesLabel(activeCount)}` : ''} pagam{' '}
              <b className="text-(--adm-ink)">R$ 0,00</b> de taxa. As taxas cadastradas não mudam e voltam a valer
              quando você desativar. Retirada no balcão não é afetada.
            </>
          ) : (
            <>
              Os pedidos novos voltam a pagar a taxa cadastrada de cada bairro. Os pedidos já feitos continuam com o
              valor que foi cobrado.
            </>
          )}
        </ConfirmDialog>
      )}
    </section>
  );
}

interface ZoneRowProps {
  zone: DeliveryZone;
  freeDelivery: boolean;
  saving: boolean;
  onSave: (zone: DeliveryZone, text: string) => void;
  onDelete: () => void;
}

function ZoneRow({ zone, freeDelivery, saving, onSave, onDelete }: ZoneRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameField = useCommitField(zone.name, (value) => {
    const name = value.trim();
    if (name && name !== zone.name) onSave({ ...zone, name }, `Bairro renomeado para ${name}`);
  });
  const feeField = useCommitField(priceToInput(zone.fee), (value) => {
    const fee = parsePrice(value);
    if (fee !== null && fee !== zone.fee) onSave({ ...zone, fee }, `${zone.name}: ${feeLabel(fee)}`);
  });

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-(--adm-divider) px-[clamp(14px,2vw,20px)] py-3.5 last:border-b-0',
        !zone.active && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1">
        <input
          aria-label={`Nome do bairro ${zone.name}`}
          maxLength={60}
          className={cn(INPUT, 'h-11 font-extrabold')}
          {...nameField}
        />
        <span className={cn('text-[13px]', MUTED)}>
          {!zone.active ? (
            'Fora do checkout'
          ) : freeDelivery ? (
            <>
              Cobrado agora: {zone.fee > 0 && <s>{formatCurrency(zone.fee)}</s>}{' '}
              <b className="text-(--adm-green-text)">Grátis</b>
            </>
          ) : (
            `Cobrado agora: ${feeLabel(zone.fee)}`
          )}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3.5">
        <PrefixedInput
          prefix="R$"
          compact
          aria-label={`Taxa de ${zone.name}`}
          title="Taxa cadastrada — edite e aperte Enter"
          inputMode="decimal"
          className="w-[124px]"
          {...feeField}
        />
        <div className="flex flex-col items-center gap-0.5">
          <Switch
            label={`Ativo: ${zone.name}`}
            checked={zone.active}
            disabled={saving}
            onChange={(active) =>
              onSave(
                { ...zone, active },
                active ? `${zone.name} de volta no checkout` : `${zone.name} fora do checkout`,
              )
            }
          />
          <span className={cn('text-[11px] font-bold', MUTED)}>{zone.active ? 'Ativo' : 'Inativo'}</span>
        </div>
        <ConfirmButton
          label="Excluir"
          confirmLabel="Confirmar"
          confirming={confirmDelete}
          disabled={saving}
          onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          className="h-11 rounded-[10px] px-3.5"
        />
      </div>
    </div>
  );
}

/** Página "Taxas de entrega": promoção de entrega grátis, bairros e taxa única. */
export function DeliveryFeesTab({ data }: { data: AdminData }) {
  const { zones, settings, saving, saveZone, deleteZone, saveSettings, notify } = data;
  const [newName, setNewName] = useState('');
  const [newFee, setNewFee] = useState('');
  const activeCount = zones.filter((zone) => zone.active).length;

  const fallbackField = useCommitField(priceToInput(settings.deliveryFee), (value) => {
    const fee = parsePrice(value);
    if (fee === null) return notify('Taxa inválida. Ex.: 5,00', 'error');
    void saveSettings({ deliveryFee: fee }, `Taxa única: ${feeLabel(fee)}`);
  });

  const isDuplicate = (name: string, id?: string) =>
    zones.some(
      (zone) => zone.id !== id && zone.name.trim().toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'),
    );

  const save = (zone: DeliveryZone, text: string) => {
    if (isDuplicate(zone.name, zone.id)) return notify(`Já existe um bairro chamado ${zone.name}`, 'error');
    void saveZone(zone, text);
  };

  const add = async () => {
    const name = newName.trim();
    const fee = parsePrice(newFee);
    if (!name) return notify('Informe o nome do bairro', 'error');
    if (fee === null) return notify('Taxa inválida. Ex.: 5,00', 'error');
    if (isDuplicate(name)) return notify(`Já existe um bairro chamado ${name}`, 'error');
    const zone: DeliveryZone = {
      id: crypto.randomUUID(),
      name,
      fee,
      active: true,
      sortOrder: Math.max(0, ...zones.map((item) => item.sortOrder)) + 1,
    };
    if (await saveZone(zone, `${name} adicionado: ${feeLabel(fee)}`)) {
      setNewName('');
      setNewFee('');
    }
  };

  return (
    <div className="flex max-w-[820px] flex-col gap-4">
      <FreeDeliveryCard data={data} activeCount={activeCount} />

      <section aria-labelledby="zones-title" className={cn(CARD, 'overflow-hidden')}>
        <div className={cn(CARD_PAD, 'pb-4')}>
          <h2 id="zones-title" className="m-0 text-[17px] font-extrabold">
            Bairros atendidos <span className={cn('text-sm font-bold', MUTED)}>· {activeZonesLabel(activeCount)}</span>
          </h2>
          <p className={cn('mt-0.5 mb-0 text-sm', MUTED)}>
            {activeCount
              ? 'O cliente escolhe o bairro no checkout e paga a taxa dele. Bairro inativo some do checkout, mas a taxa fica guardada.'
              : 'Nenhum bairro ativo: o checkout aceita qualquer bairro e cobra a taxa única (abaixo).'}
            {settings.freeDeliveryEnabled && ' Durante a promoção, o cliente vê a taxa riscada e não paga a entrega.'}
          </p>
        </div>

        <div className="border-t border-(--adm-divider)">
          {zones.map((zone) => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              freeDelivery={settings.freeDeliveryEnabled}
              saving={saving}
              onSave={save}
              onDelete={() => void deleteZone(zone)}
            />
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
          className="flex flex-wrap items-end gap-3 border-t border-(--adm-divider) bg-(--adm-faint) px-[clamp(14px,2vw,20px)] py-4"
        >
          <Field id="zone-name" label="Novo bairro" className="flex-[1_1_200px]">
            <input
              id="zone-name"
              value={newName}
              maxLength={60}
              placeholder="Ex.: Centro"
              onChange={(event) => setNewName(event.target.value)}
              className={cn(INPUT, 'h-11')}
            />
          </Field>
          <Field id="zone-fee" label="Taxa">
            <PrefixedInput
              id="zone-fee"
              prefix="R$"
              compact
              inputMode="decimal"
              placeholder="0,00"
              value={newFee}
              onChange={(event) => setNewFee(event.target.value)}
              className="w-[124px]"
            />
          </Field>
          <button type="submit" disabled={saving} className={cn(BTN_PRIMARY, 'h-11')}>
            + ADICIONAR
          </button>
        </form>
      </section>

      <section className={cn(CARD, CARD_PAD)}>
        <Field
          id="s-fee"
          label="Taxa única"
          hint={
            activeCount
              ? 'Não está valendo agora: com bairros ativos, cada bairro paga a sua taxa.'
              : 'Vale para qualquer endereço enquanto nenhum bairro estiver ativo. Use 0 para frete grátis.'
          }
          className="max-w-[280px]"
        >
          <PrefixedInput id="s-fee" prefix="R$" inputMode="decimal" {...fallbackField} />
        </Field>
      </section>

      {zones.length === 0 && (
        <p className={cn('m-0 text-sm', MUTED)}>
          Dica: cadastre os bairros com as taxas de cada um. A promoção de entrega grátis vale para todos eles sem mexer
          nos valores.
        </p>
      )}
    </div>
  );
}
