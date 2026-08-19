const DESCONHECIDO = "desconhecido";
const MAX_USER_AGENT_LENGTH = 500;

function limparHeader(value: string | null) {
  const header = value?.trim();

  return header || null;
}

function normalizarIp(value: string | null) {
  const header = limparHeader(value);

  if (!header) {
    return null;
  }

  const [primeiroIp] = header.split(",");
  const ip = primeiroIp?.trim();

  return ip || null;
}

function normalizarUserAgent(value: string | null) {
  const userAgent = limparHeader(value);

  if (!userAgent) {
    return DESCONHECIDO;
  }

  return userAgent.slice(0, MAX_USER_AGENT_LENGTH);
}

export function getDadosAuditoriaAssinatura(headers: Headers) {
  return {
    ip:
      normalizarIp(headers.get("x-forwarded-for")) ??
      normalizarIp(headers.get("x-real-ip")) ??
      normalizarIp(headers.get("cf-connecting-ip")) ??
      DESCONHECIDO,
    userAgent: normalizarUserAgent(headers.get("user-agent")),
  };
}
