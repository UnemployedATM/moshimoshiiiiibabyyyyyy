import { serverClient as supabase } from '../../../lib/supabase-server';
import type { APIRoute } from 'astro';

/**
 * Admin upsert / partial update for the Client table.
 *
 *   Body: {
 *     token: string                  // REQUIRED, identifies the client
 *     name?: string                  // required only when creating a new client
 *     briefHtml?: string             // required only when creating; optional on update
 *     questionnaireType?: string | null   // set to null to disable the Cuestionario tab
 *     pipelineHtml?: string | null   // set to null to disable the Pipeline tab
 *     clearAnswers?: boolean         // wipe submitted answers + timestamp
 *   }
 *
 * Behavior:
 *   - If the client doesn't exist yet, name + briefHtml are required.
 *   - If the client exists, any subset of fields gets updated. Fields not
 *     present in the body are left untouched.
 *   - `questionnaireType: ""` (empty string) is treated as null (disables tab).
 *   - Same for `pipelineHtml: ""`.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // Auth — read from process.env so it works at runtime on Vercel without
  // relying on Vite build-time inlining. Fail-closed if either side is
  // missing or empty (otherwise `undefined === undefined` would auth).
  const expected = process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD;
  const authCookie = cookies.get('admin_auth')?.value;
  const authed =
    typeof expected   === 'string' && expected.length   > 0 &&
    typeof authCookie === 'string' && authCookie.length > 0 &&
    authCookie === expected;
  if (!authed) {
    if (!expected) {
      console.error('[admin/client] ADMIN_PASSWORD env var not set — refusing.');
    }
    return new Response('Unauthorized', { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  // Look up existing client (case-insensitive token).
  const { data: existing, error: lookupErr } = await supabase
    .from('Client')
    .select('id, token')
    .ilike('token', token)
    .maybeSingle();

  if (lookupErr) {
    console.error('[admin/client] Lookup error:', lookupErr);
    return new Response(lookupErr.message, { status: 500 });
  }

  // Build payload from only the fields that were sent (partial update).
  const payload: Record<string, any> = { token };

  if (typeof body.name === 'string') payload.name = body.name.trim();

  if (typeof body.briefHtml === 'string') payload.briefHtml = body.briefHtml;

  if ('questionnaireType' in body) {
    payload.questionnaireType =
      typeof body.questionnaireType === 'string' && body.questionnaireType.trim()
        ? body.questionnaireType.trim()
        : null;
  }

  if ('pipelineHtml' in body) {
    payload.pipelineHtml =
      typeof body.pipelineHtml === 'string' && body.pipelineHtml.trim()
        ? body.pipelineHtml
        : null;
  }

  if (body.clearAnswers === true) {
    payload.questionnaireAnswers = null;
    payload.questionnaireSubmittedAt = null;
  }

  // Branch on create vs update — upsert with a partial payload breaks
  // NOT NULL columns like `name`, because the INSERT side of upsert validates
  // its own row before resolving the ON CONFLICT clause.
  let client: any;
  let writeErr: any;

  if (!existing) {
    // Creating new → require the minimum bootstrap fields.
    if (!payload.name || !payload.briefHtml) {
      return new Response(
        'New clients require both `name` and `briefHtml`',
        { status: 400 },
      );
    }
    const res = await supabase
      .from('Client')
      .insert(payload)
      .select()
      .single();
    client = res.data;
    writeErr = res.error;
  } else {
    // Updating existing → only touch the columns we were given.
    // Drop `token` so we don't no-op-rewrite the immutable primary identifier
    // (and so case-insensitive lookups don't accidentally change capitalization).
    const { token: _t, ...updatePayload } = payload;
    if (Object.keys(updatePayload).length === 0) {
      // Nothing to write — return the existing row unchanged.
      const res = await supabase
        .from('Client')
        .select('*')
        .eq('id', existing.id)
        .single();
      client = res.data;
      writeErr = res.error;
    } else {
      const res = await supabase
        .from('Client')
        .update(updatePayload)
        .eq('id', existing.id)
        .select()
        .single();
      client = res.data;
      writeErr = res.error;
    }
  }

  if (writeErr) {
    console.error('[admin/client] Write error:', writeErr);
    return new Response(writeErr.message, { status: 500 });
  }

  return new Response(JSON.stringify(client), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
