import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/** Cliente Supabase para componentes do navegador (usa apenas a chave pública). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
