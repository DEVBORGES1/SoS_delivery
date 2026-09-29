/**
 * Credenciais públicas do Supabase, lidas do `.env` (veja `.env.example`).
 * Sem elas, o site funciona só com os dados do código.
 */
export const supabaseConfig = {
  url: (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, ''),
  key: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
};

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.key);
