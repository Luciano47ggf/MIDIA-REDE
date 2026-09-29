import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

/** Retorna o perfil do membro da equipe logado, ou null. */
export async function getTeamUser(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();
  return profile ?? null;
}

/** Para páginas e server actions: redireciona para /login se não estiver autenticado. */
export async function requireTeamUser(): Promise<Profile> {
  const profile = await getTeamUser();
  if (!profile) redirect("/login");
  return profile;
}

/** Para rotas de API: devolve o perfil ou uma resposta 401 pronta. */
export async function requireTeamUserApi(): Promise<{ profile: Profile } | { response: NextResponse }> {
  const profile = await getTeamUser();
  if (!profile) {
    return { response: NextResponse.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 }) };
  }
  return { profile };
}
