import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { serverEnv } from "@/lib/env";

/**
 * Cliente com a SERVICE ROLE KEY. Ignora RLS.
 * Use SOMENTE no servidor, e sempre filtrando o que pode ser mostrado (ex.: status = published).
 */
export function createAdminClient() {
  return createClient<Database>(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
