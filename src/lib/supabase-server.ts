/**
 * Server-only Supabase client using the service_role key.
 *
 *   - Bypasses RLS by design — use only from server code (Astro `---` blocks
 *     in src/pages, src/pages/api endpoints). Never import from src/components
 *     or any `client:*` script: that would leak the key into the browser
 *     bundle.
 *   - Reads env vars from `process.env` first (always populated at request
 *     time on Vercel), falling back to `import.meta.env` for local dev.
 *   - Does NOT throw at module load if the key is missing. Logs a clear
 *     warning to `vercel logs` so the missing config is debuggable without
 *     crashing every request.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ?? import.meta.env.SUPABASE_URL ?? '';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ??
  '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[supabase-server] Missing env at runtime', {
    hasUrl: !!supabaseUrl,
    hasServiceRoleKey: !!serviceRoleKey,
  });
}

export const serverClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
