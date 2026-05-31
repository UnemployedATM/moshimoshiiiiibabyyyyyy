import { createClient } from '@supabase/supabase-js';

// In Astro SSR on Vercel, `import.meta.env.X` (for non-PUBLIC vars) is
// inlined by Vite at build time. If the value isn't surfaced to the build,
// the deployed function ends up with `undefined` baked in and every
// Supabase call returns null — pages then 404 from the `if (!client)`
// guard. `process.env` is read at request time and always reflects the
// env vars Vercel injects, so prefer it; fall back to `import.meta.env`
// for local dev.
const supabaseUrl =
  process.env.SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Surfaces in `vercel logs`; doesn't crash the function so the page
  // still renders an error rather than a 500.
  console.error('[supabase] Missing env at runtime', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
  });
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
