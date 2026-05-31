import { serverClient as supabase } from '../../../lib/supabase-server';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Verify admin auth (read from process.env so it works at runtime on Vercel
  // without relying on Vite build-time inlining).
  const expected = process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD;
  const authCookie = cookies.get('admin_auth')?.value;
  if (authCookie !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, token, briefHtml } = data;

    if (!name || !token || !briefHtml) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Upsert into Supabase (token is the unique constraint)
    const { data: client, error } = await supabase
      .from('Client')
      .upsert({ name, token, briefHtml }, { onConflict: 'token' })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(client), { status: 200 });
  } catch (error: any) {
    console.error("Failed to save client:", error);
    return new Response(error.message, { status: 500 });
  }
};
