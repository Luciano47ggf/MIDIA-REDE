import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// No Next.js 16 o antigo "middleware.ts" passou a se chamar "proxy.ts".
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
