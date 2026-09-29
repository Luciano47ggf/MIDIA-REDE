import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Lê o JSON do corpo sem quebrar caso venha inválido. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function logServerError(context: string, err: unknown) {
  console.error(`[${context}]`, err instanceof Error ? err.message : err);
}
