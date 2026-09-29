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
  get r2AccountId() {
    return required("R2_ACCOUNT_ID");
  },
  get r2AccessKeyId() {
    return required("R2_ACCESS_KEY_ID");
  },
  get r2SecretAccessKey() {
    return required("R2_SECRET_ACCESS_KEY");
  },
  get r2Bucket() {
    return required("R2_BUCKET_NAME");
  },
  get r2PublicUrl() {
    return required("R2_PUBLIC_URL").replace(/\/+$/, "");
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
