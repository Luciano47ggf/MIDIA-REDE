import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";

/**
 * Álbuns protegidos por senha:
 * - a senha fica no banco apenas como hash (bcrypt);
 * - depois que o visitante acerta a senha, gravamos um cookie assinado (HMAC).
 * - se a senha do álbum mudar, os cookies antigos deixam de valer.
 */
export function accessCookieName(albumId: string) {
  return `album_${albumId.replace(/-/g, "")}`;
}

export function accessToken(albumId: string, passwordHash: string) {
  return createHmac("sha256", serverEnv.albumAccessSecret).update(`${albumId}:${passwordHash}`).digest("base64url");
}

export async function hasAlbumAccess(album: {
  id: string;
  visibility: string;
  password_hash: string | null;
}): Promise<boolean> {
  if (album.visibility !== "password") return true;
  if (!album.password_hash) return false;
  const store = await cookies();
  const value = store.get(accessCookieName(album.id))?.value;
  if (!value) return false;
  const expected = accessToken(album.id, album.password_hash);
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function grantAlbumAccess(albumId: string, passwordHash: string) {
  const store = await cookies();
  store.set(accessCookieName(albumId), accessToken(albumId, passwordHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
