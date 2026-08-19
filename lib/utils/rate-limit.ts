// Rate limiting simples em memória, por processo — sem dependência externa
// (ex: Redis). Adequado para uma única instância; em deploy multi-instância
// (múltiplos containers/serverless), cada instância mantém sua própria
// contagem, então o limite efetivo escala com o número de instâncias. Para
// esse cenário, substitua este módulo por um contador compartilhado (ex:
// Redis com INCR + EXPIRE).
const tentativasPorChave = new Map<string, { contagem: number; expiraEm: number }>();

// Evita crescimento indefinido do Map quando muitas chaves distintas passam
// por aqui (ex: IPs diferentes) e nunca mais voltam a ser consultadas.
const LIMITE_CHAVES_RASTREADAS = 10_000;

function limparExpirados(agora: number) {
  if (tentativasPorChave.size < LIMITE_CHAVES_RASTREADAS) {
    return;
  }

  for (const [chave, entrada] of tentativasPorChave) {
    if (entrada.expiraEm <= agora) {
      tentativasPorChave.delete(chave);
    }
  }
}

export type RateLimitResult = {
  permitido: boolean;
  restante: number;
  reiniciaEm: Date;
};

/**
 * Verifica e incrementa a contagem de tentativas para `chave` dentro da
 * janela de tempo `janelaMs`. Cada chamada conta como uma tentativa, mesmo
 * quando `permitido` é `false` — o chamador decide o que fazer com o
 * resultado (ex: bloquear a ação, mas nunca deixar de contar).
 */
export function verificarRateLimit(
  chave: string,
  limite: number,
  janelaMs: number,
): RateLimitResult {
  const agora = Date.now();

  limparExpirados(agora);

  const entrada = tentativasPorChave.get(chave);

  if (!entrada || entrada.expiraEm <= agora) {
    const expiraEm = agora + janelaMs;
    tentativasPorChave.set(chave, { contagem: 1, expiraEm });

    return { permitido: true, restante: limite - 1, reiniciaEm: new Date(expiraEm) };
  }

  entrada.contagem += 1;

  return {
    permitido: entrada.contagem <= limite,
    restante: Math.max(0, limite - entrada.contagem),
    reiniciaEm: new Date(entrada.expiraEm),
  };
}
