import { decrypt, encrypt, hashForLookup } from "./encryption-engine";

// Models que possuem campos PII cifrados (String, valor "v1:...") em repouso.
const MODELS_COM_PII_CIFRADA = new Set(["User"]);

// Campos com um `<campo>Hash` irmão (HMAC determinístico) para permitir
// lookup exato via WHERE — usado hoje em auth (email). `normalizar` roda
// antes do hash/cifragem para garantir que o mesmo valor lógico (ex: e-mails
// com case/espaço diferentes) sempre gere o mesmo hash, mesmo que algum
// caller esqueça de normalizar antes.
const CAMPOS_COM_HASH: Record<string, { hashField: string; normalizar?: (valor: string) => string }> = {
  email: { hashField: "emailHash", normalizar: (valor) => valor.trim().toLowerCase() },
};

const TODOS_CAMPOS_CIFRADOS = new Set(Object.keys(CAMPOS_COM_HASH));

type PlainObject = Record<string, unknown>;

// Exclui Date (e outros objetos com prototype não-Object, como Buffer/Decimal
// retornados pelo Prisma) — Object.entries() sobre um Date não enumera
// getTime/toISOString, então tratá-lo como plain object aqui zeraria o valor.
function isPlainObject(valor: unknown): valor is PlainObject {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor) &&
    Object.getPrototypeOf(valor) === Object.prototype
  );
}

// Cifra todos os campos PII presentes em um bloco `data` de create/update, e
// popula os respectivos `*Hash` (nested writes não são necessários aqui: cada
// model nested passa pela própria extensão do Prisma, então só tratamos o
// nível raiz do `data` deste model).
function cifrarData(data: unknown): unknown {
  if (!isPlainObject(data)) {
    return data;
  }

  const atualizado: PlainObject = { ...data };
  let alterou = false;

  for (const campo of TODOS_CAMPOS_CIFRADOS) {
    const valor = data[campo];

    if (typeof valor !== "string") {
      continue;
    }

    const config = CAMPOS_COM_HASH[campo];
    const valorNormalizado = config?.normalizar ? config.normalizar(valor) : valor;

    atualizado[campo] = encrypt(valorNormalizado);

    if (config) {
      atualizado[config.hashField] = hashForLookup(valorNormalizado);
    }

    alterou = true;
  }

  return alterou ? atualizado : data;
}

// Reescreve `where: { email: "..." }` para `where: { emailHash: hash(...) }`,
// já que o valor cifrado tem IV aleatório e nunca bate por igualdade direta.
function reescreverWhereCampos(where: unknown): unknown {
  if (!isPlainObject(where)) {
    return where;
  }

  const resultado: PlainObject = { ...where };

  for (const [campo, config] of Object.entries(CAMPOS_COM_HASH)) {
    const valor = resultado[campo];

    if (typeof valor !== "string") {
      continue;
    }

    const valorNormalizado = config.normalizar ? config.normalizar(valor) : valor;

    delete resultado[campo];
    resultado[config.hashField] = hashForLookup(valorNormalizado);
  }

  return resultado;
}

function reescreverArgs(args: unknown): unknown {
  if (!isPlainObject(args)) {
    return args;
  }

  const novosArgs: PlainObject = { ...args };

  if ("data" in novosArgs) {
    novosArgs.data = Array.isArray(novosArgs.data)
      ? novosArgs.data.map(cifrarData)
      : cifrarData(novosArgs.data);
  }

  if ("where" in novosArgs) {
    novosArgs.where = reescreverWhereCampos(novosArgs.where);
  }

  // upsert possui create/update em vez de data
  if ("create" in novosArgs) {
    novosArgs.create = cifrarData(novosArgs.create);
  }

  if ("update" in novosArgs) {
    novosArgs.update = cifrarData(novosArgs.update);
  }

  return novosArgs;
}

// Decifra qualquer campo PII (String, valor "v1:...") encontrado
// recursivamente no resultado, cobrindo relations aninhadas trazidas via
// include/select.
function decifrarResultado(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map(decifrarResultado);
  }

  if (!isPlainObject(valor)) {
    return valor;
  }

  const resultado: PlainObject = {};

  for (const [chave, item] of Object.entries(valor)) {
    if (TODOS_CAMPOS_CIFRADOS.has(chave) && typeof item === "string" && item.startsWith("v1:")) {
      resultado[chave] = decrypt(item);
      continue;
    }

    resultado[chave] = isPlainObject(item) || Array.isArray(item) ? decifrarResultado(item) : item;
  }

  return resultado;
}

// Usado pelo audit-log-extension para recifrar um snapshot já decifrado
// (dadosAntes, obtido via client completo) antes de persistir no AuditLog,
// mantendo consistência com dadosDepois (que já sai cifrado da query
// principal, por auditExtension rodar mais perto do driver que
// encryptionExtension — ver comentário de ordem em lib/db.ts).
export function recifrarParaAuditoria(model: string, snapshot: unknown): unknown {
  if (!MODELS_COM_PII_CIFRADA.has(model) || !isPlainObject(snapshot)) {
    return snapshot;
  }

  return cifrarData(snapshot);
}

export const encryptionExtension = {
  query: {
    $allModels: {
      async $allOperations({
        model,
        args,
        query,
      }: {
        model?: string;
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
      }) {
        // A reescrita de data/where só faz sentido quando o model raiz da
        // query tem campos PII próprios (ex: email da própria tabela). A
        // decifragem do resultado, porém, roda sempre: uma query em qualquer
        // model pode trazer um User aninhado via include/select, e
        // decifrarResultado já é recursivo e seguro (só decifra campos cujo
        // nome está na lista e cujo valor começa com o prefixo "v1:").
        const argsEscopados =
          model && MODELS_COM_PII_CIFRADA.has(model) ? reescreverArgs(args) : args;

        const resultado = await query(argsEscopados);

        return decifrarResultado(resultado);
      },
    },
  },
};
