import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { serverEnv } from "@/lib/env";

/** Cliente Supabase no servidor com a sessão do usuário logado (respeita RLS). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(serverEnv.supabaseUrl, serverEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component: o proxy.ts já cuida de renovar a sessão.
        }
      },
    },
  });
}
