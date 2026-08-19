import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { env } from "../../env";

// AES-256-GCM: cifra autenticada (AEAD). Cada valor recebe um IV aleatório de
// 12 bytes, garantindo que o mesmo texto claro nunca produza o mesmo cifrado
// duas vezes. O authTag do GCM detecta qualquer adulteração do dado em repouso.
const ALGORITMO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

// Prefixo de versão do formato/chave. Permite trocar de chave (rotação) ou de
// algoritmo no futuro sem quebrar a decifragem de dados já persistidos.
const VERSAO_ATUAL = "v1";

let chaveCache: Buffer | null = null;

function obterChave(): Buffer {
  if (chaveCache) {
    return chaveCache;
  }

  const chave = Buffer.from(env.ENCRYPTION_KEY, "base64");

  if (chave.length !== 32) {
    throw new Error("ENCRYPTION_KEY inválida: esperado 32 bytes em base64 (AES-256)");
  }

  chaveCache = chave;

  return chaveCache;
}

/**
 * Cifra um valor em texto claro. Retorna string no formato
 * "v1:<base64(iv || authTag || ciphertext)>", pronta para persistir em coluna String.
 */
export function encrypt(texto: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITMO, obterChave(), iv);

  const ciphertext = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, authTag, ciphertext]).toString("base64");

  return `${VERSAO_ATUAL}:${payload}`;
}

/**
 * Decifra um valor gerado por encrypt(). Lança se o formato/versão for
 * desconhecido ou se a autenticação (authTag) falhar, indicando adulteração.
 */
export function decrypt(valorCifrado: string): string {
  const [versao, payload] = valorCifrado.split(":", 2);

  if (versao !== VERSAO_ATUAL || !payload) {
    throw new Error(`Formato de valor cifrado desconhecido: versão "${versao}"`);
  }

  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, IV_BYTES);
  const authTag = buffer.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buffer.subarray(IV_BYTES + TAG_BYTES);

  const decipher = createDecipheriv(ALGORITMO, obterChave(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * Hash determinístico (HMAC-SHA256) para permitir busca exata (WHERE) sobre
 * um campo cifrado com IV aleatório, sem expor o valor original nem permitir
 * força bruta offline sem a chave.
 */
export function hashForLookup(texto: string): string {
  return createHmac("sha256", obterChave()).update(texto, "utf8").digest("hex");
}
