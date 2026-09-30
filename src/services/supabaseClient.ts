import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseConfig } from './supabaseConfig';

/**
 * Cliente completo do Supabase (login e gravação). Só o painel `/admin`
 * importa este arquivo, então o SDK não pesa no site dos clientes.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sos-delivery-admin' },
    })
  : null;

/** Traduz os erros mais comuns para mensagens em português. */
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error);
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(message)) return 'E-mail ainda não confirmado no Supabase.';
  if (/row-level security|permission denied/i.test(message)) return 'Sem permissão: este usuário não é administrador.';
  if (/failed to fetch|network/i.test(message)) return 'Sem conexão com o Supabase. Verifique a internet.';
  if (/could not find the .* column/i.test(message)) {
    return 'Banco desatualizado: rode o supabase/schema.sql de novo no SQL Editor do Supabase.';
  }
  return message || 'Erro inesperado.';
}
