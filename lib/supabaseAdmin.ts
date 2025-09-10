
import { createClient } from '@supabase/supabase-js';

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Supabase URL or Service Role Key is missing');
  return createClient(url, key, { auth: { persistSession: false } });
}
