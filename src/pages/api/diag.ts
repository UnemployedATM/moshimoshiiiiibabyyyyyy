// TEMPORARY diagnostic endpoint — DELETE after debugging.
// Returns env presence + a Supabase ping for the Kine-0123 row.
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async () => {
  const result: any = {
    runtime: {
      hasProcessEnv: typeof process !== 'undefined' && !!process.env,
      processEnv_SUPABASE_URL: !!process?.env?.SUPABASE_URL,
      processEnv_SUPABASE_ANON_KEY: !!process?.env?.SUPABASE_ANON_KEY,
      importMeta_SUPABASE_URL: !!import.meta.env.SUPABASE_URL,
      importMeta_SUPABASE_ANON_KEY: !!import.meta.env.SUPABASE_ANON_KEY,
      // Mask but show length so we know they're real strings, not empty
      urlLen:
        (process?.env?.SUPABASE_URL ?? import.meta.env.SUPABASE_URL ?? '')
          .length,
      keyLen:
        (process?.env?.SUPABASE_ANON_KEY ??
          import.meta.env.SUPABASE_ANON_KEY ??
          '').length,
    },
  };

  try {
    const url =
      process?.env?.SUPABASE_URL ?? import.meta.env.SUPABASE_URL ?? '';
    const key =
      process?.env?.SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_ANON_KEY ?? '';
    const sb = createClient(url, key);
    const all = await sb.from('Client').select('token, name').limit(20);
    const eq = await sb.from('Client').select('token').eq('token', 'Kine-0123');
    const il = await sb.from('Client').select('token').ilike('token', 'kine-0123');
    result.db = {
      all_count: all.data?.length ?? null,
      all_tokens: all.data?.map((r: any) => r.token) ?? null,
      all_error: all.error?.message ?? null,
      eq_count: eq.data?.length ?? null,
      eq_error: eq.error?.message ?? null,
      ilike_count: il.data?.length ?? null,
      ilike_error: il.error?.message ?? null,
    };
  } catch (e: any) {
    result.db = { thrown: e?.message ?? String(e) };
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
