/** Erro com mensagem já pronta para mostrar ao usuário. */
export class UploadError extends Error {
  constructor(
    message: string,
    public readonly retryable = true,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export class AbortedError extends Error {
  constructor() {
    super("Envio cancelado.");
    this.name = "AbortedError";
  }
}

/** Chama uma rota da nossa API e converte falhas em mensagens compreensíveis. */
export async function apiPost<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    if (signal?.aborted) throw new AbortedError();
    throw new UploadError("Falha de conexão. Verifique a internet e tente novamente.");
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // resposta sem JSON
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Erro no servidor (${res.status}).`;
    // 4xx de validação não adianta repetir; 401 (sessão) e 5xx sim.
    const retryable = res.status >= 500 || res.status === 401 || res.status === 409 || res.status === 429;
    throw new UploadError(message, retryable);
  }
  return data as T;
}
