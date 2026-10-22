import { useState } from 'react';

/** Campo de texto que grava ao sair do campo (ou com Enter), como no mockup. */
export function useCommitField(current: string, commit: (value: string) => void) {
  const [draft, setDraft] = useState<string | null>(null);
  return {
    value: draft ?? current,
    onChange: (event: { target: { value: string } }) => setDraft(event.target.value),
    onBlur: () => {
      if (draft !== null && draft !== current) commit(draft);
      setDraft(null);
    },
    onKeyDown: (event: { key: string; currentTarget: HTMLInputElement }) => {
      if (event.key === 'Enter') event.currentTarget.blur();
    },
  };
}
