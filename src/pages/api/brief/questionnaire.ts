import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

// POST /api/brief/questionnaire
// Body: { token: string, type: string, answers: object }
// Auth: knowledge of the token is the only credential (same model as the
// existing /briefs/[token] page). The endpoint validates that a Client with
// that token exists before writing, and stores the answers + a UTC timestamp.
export const POST: APIRoute = async ({ request }) => {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const token   = String(payload?.token   ?? '').trim();
  const type    = String(payload?.type    ?? '').trim();
  const answers = payload?.answers;

  if (!token)                           return json({ error: 'Missing token' },   400);
  if (!type)                            return json({ error: 'Missing type' },    400);
  if (!answers || typeof answers !== 'object')
                                        return json({ error: 'Missing answers' }, 400);

  // Confirm the client exists for this token.
  const { data: existing, error: lookupErr } = await supabase
    .from('Client')
    .select('id, token, questionnaireType')
    .ilike('token', token)
    .single();

  if (lookupErr || !existing) {
    return json({ error: 'Unknown token' }, 404);
  }

  // Only allow the type that was preconfigured for this client.
  if (existing.questionnaireType && existing.questionnaireType !== type) {
    return json({ error: 'Questionnaire type mismatch' }, 400);
  }

  const submittedAt = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('Client')
    .update({
      questionnaireType:        type,
      questionnaireAnswers:     answers,
      questionnaireSubmittedAt: submittedAt,
    })
    .eq('id', existing.id);

  if (updateErr) {
    console.error('Questionnaire update failed:', updateErr);
    return json({ error: updateErr.message }, 500);
  }

  return json({ ok: true, submittedAt }, 200);
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
