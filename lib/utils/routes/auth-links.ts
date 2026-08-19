// Server-only: monta links absolutos enviados por e-mail (convites, confirmação
// de conta, redefinição de senha), que precisam da URL pública da aplicação.
export function getAppBaseUrl() {
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    throw new Error("NEXTAUTH_URL não configurada.");
  }

  return baseUrl;
}
