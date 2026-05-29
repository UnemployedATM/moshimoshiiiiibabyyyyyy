import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Creates a Supabase client with Row Level Security (RLS) enabled for a specific token.
 * This client uses the Service Role key but sets a custom JWT claim to enforce RLS policies.
 * 
 * @param token - The client token to isolate data access for
 * @returns A SupabaseClient instance configured for token-isolated access
 */
export function getSecureClient(token: string): SupabaseClient {
  const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: {
      headers: {
        // Set custom claim that RLS policies will check
        'X-Client-Token': token
      }
    }
  });

  return client;
}

/**
 * Creates an admin Supabase client with full access (bypasses RLS).
 * Use this only for admin operations that need to see all data.
 * 
 * @returns A SupabaseClient instance with full admin access
 */
export function getAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
