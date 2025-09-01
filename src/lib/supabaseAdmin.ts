import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

// Server-only client with service role key (do NOT expose to browser)
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase env vars for admin client');
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};


