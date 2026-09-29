/** Leitura das variáveis de ambiente do SERVIDOR com mensagens claras quando faltar algo. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}. Confira o arquivo .env.local (ou as variáveis na Vercel).`);
  }
  return value;
}

export const serverEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get b2KeyId() {
    return required("B2_KEY_ID");
  },
  get b2ApplicationKey() {
    return required("B2_APPLICATION_KEY");
  },
  get b2BucketName() {
    return required("B2_BUCKET_NAME");
  },
  get b2Endpoint() {
    return required("B2_ENDPOINT").replace(/\/+$/, "");
  },
  get b2Region() {
    return required("B2_REGION");
  },
  get albumAccessSecret() {
    const v = required("ALBUM_ACCESS_SECRET");
    if (v.length < 32) throw new Error("ALBUM_ACCESS_SECRET precisa ter pelo menos 32 caracteres.");
    return v;
  },
};

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}
