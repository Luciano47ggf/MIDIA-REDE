"use server";

import bcrypt from "bcryptjs";
import { grantAlbumAccess } from "@/lib/album-access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/types";

/** Confere a senha de um álbum protegido e libera o acesso (cookie assinado). */
export async function unlockAlbumAction(slug: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { ok: false, message: "Digite a senha." };

  const db = createAdminClient();
  const { data: album } = await db
    .from("albums")
    .select("id, status, visibility, password_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (!album || album.status !== "published" || album.visibility !== "password" || !album.password_hash) {
    return { ok: false, message: "Álbum não encontrado." };
  }

  const valid = await bcrypt.compare(password, album.password_hash);
  if (!valid) {
    await new Promise((r) => setTimeout(r, 600)); // dificulta tentativas em sequência
    return { ok: false, message: "Senha incorreta." };
  }

  await grantAlbumAccess(album.id, album.password_hash);
  return { ok: true };
}
