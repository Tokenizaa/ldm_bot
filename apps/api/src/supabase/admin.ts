import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppEnv } from '../config/env';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(env: AppEnv): SupabaseClient {
  if (client) return client;
  client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return client;
}

