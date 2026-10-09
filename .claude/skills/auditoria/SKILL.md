---
name: auditoria
description: Use ao criar ou alterar qualquer ação que mexe em dinheiro, altera dado de negócio ou configuração pela equipe, mexe em acesso (papéis, permissões, membros, planos, senha, e-mail, convites), muda status manualmente ou exporta dados, e ao mexer em lib/services/audit-log*. Define o que entra na trilha de auditoria (AuditLog), o que nunca entra e como registrar.
---

# Auditoria

A trilha de auditoria responde, meses depois e para alguém que não estava lá: **quem fez o quê, quando, de onde, sobre qual registro, e o que mudou**. Ela existe para responsabilização (LGPD art. 6º, X), investigação de incidente e fraude, e para resolver disputa ("eu não alterei isso").

Detalhes de implementação (cadeia de hash, verificação): `lib/fumadocs/content/docs/auditoria.mdx`.

## Regra geral

Toda ação que **mexe em dinheiro**, **altera dado ou configuração que outra pessoa usa**, **muda quem pode fazer o quê** ou **tira dados do sistema** gera um registro de auditoria, gravado no servidor, na mesma transação da operação sempre que possível.

Para decidir, pergunte: *se esse valor estiver errado amanhã, alguém vai precisar saber quem mudou e o que era antes?* Se sim, audite.

Não audite:

- **Leituras comuns** (listar, ver detalhe). Exceção: exportação em massa e acesso a dado sensível de terceiro.
- **Escritas automáticas de alto volume que já têm histórico próprio.** Viram ruído e escondem o que importa.
- **Conteúdo enviado pelo próprio usuário que já fica na tabela dele** (ex.: mensagem do fale conosco). Audite o que a equipe faz com ele, não o envio.

## Conceitos e princípios

- **Auditoria ≠ log operacional.** Log (Pino, stdout) é para depurar: efêmero, verboso, sem garantia. Auditoria é registro de responsabilidade: permanente, enxuto, à prova de adulteração detectável. Um nunca substitui o outro.
- **Os 5 Ws.** Cada registro tem ator (quem, ou `sistema`), ação (verbo de negócio), alvo (entidade + id), quando (relógio do servidor), de onde (IP, user agent) e o efeito (antes/depois, ou o resumo do que aconteceu).
- **Não repúdio.** O ator vem da sessão no servidor, nunca do formulário. Sem ator identificável, o registro não prova nada.
- **Tamper-evident.** Registros só são inseridos, nunca editados nem apagados pela aplicação; a cadeia de hash torna qualquer alteração direta no banco detectável. Corrigir um erro é gravar um novo registro, não reescrever o antigo.
- **Minimização.** Grave o necessário para reconstituir o fato, não a linha inteira. Dado pessoal na trilha é dado pessoal sob a LGPD.
- **Atomicidade.** Operação e registro confirmam ou desfazem juntos. Registro de algo que não aconteceu (ou fato sem registro) destrói a confiança na trilha.
- **Sucesso e falha.** Para autenticação e autorização, a tentativa negada também é evento (detecção de abuso). Para negócio, registre o que efetivamente mudou.
- **Separação de funções.** Quem é auditado não administra a trilha: ninguém edita ou apaga registros, e qualquer tela de consulta fica restrita ao admin da plataforma.

## Boas práticas

1. **Ação como verbo de negócio no passado, em `SCREAMING_SNAKE_CASE`**, `ENTIDADE_VERBO`: `CONVITE_MEMBRO_EMPRESA_ACEITO`, `PLANO_ALTERADO`. Nunca texto livre com dado variável dentro (filtro e contagem dependem do nome fixo).
2. **Antes e depois só dos campos que importam.** Em evento sem estado, use `dadosDepois` para o resumo do efeito (quantos itens, quais ids, valor).
3. **Valores monetários como string decimal**, como o Prisma devolve `Decimal`. Nunca float.
4. **Nunca grave segredos**, nem cifrados: senha ou hash de senha, token (convite, redefinição, sessão), chave de API, dado de cartão. Se o segredo mudou, registre apenas que mudou (`snapshotsParaAuditoria` faz isso para `senha`).
5. **PII só quando necessária e sempre cifrada** nos snapshots (a extensão de criptografia já cuida dos campos cifrados em repouso). Prefira o id ao nome e ao e-mail.
6. **Eventos automáticos têm ator `sistema`** (webhook, cron): `usuarioId` nulo e a origem no snapshot (`{ origem: "webhook-x", eventoId }`).
7. **Operação em lote:** um registro por item afetado, ou um registro com a lista de ids. Nunca um registro genérico sem dizer o que mudou.
8. **Registre depois de saber o resultado.** Ação que falhou na regra de negócio não vira registro de sucesso.
9. **Retenção:** a trilha não tem expurgo. Qualquer expurgo é decisão explícita, porque apagar o começo da cadeia exige um novo ponto de ancoragem.
10. **Teste o registro.** Feature auditada tem teste que confirma a ação gravada, o ator e o antes/depois, e que nenhum segredo aparece no snapshot.

## Neste projeto

### Peças

| Peça | Papel |
| --- | --- |
| `lib/services/audit-log.service.ts` | `registrar` (grava na cadeia, sob trava) e `verificarCadeia` |
| `lib/services/audit-log-extension.ts` | captura automática dos models em `AUDITADOS`; `snapshotsParaAuditoria` (tira segredos, cifra PII) |
| `lib/services/audit-log-autor.ts` | autor (sessão) e origem de rede (IP, user agent) da requisição |
| `lib/services/audit-log-context.ts` | `auditTxContext`: leva a transação de negócio até a gravação |

### Dois jeitos de registrar

**Captura automática** (`AUDITADOS` em `audit-log-extension.ts`): toda `create`/`update`/`delete`/`upsert` no model gera `<MODEL>_<OPERACAO>` com antes e depois. Use para models que **só a equipe escreve e com pouco volume**. Limitações:

- `updateMany`, `deleteMany`, `createMany` e SQL cru **não** são capturados.
- O antes é lido com `findUnique` pelo mesmo `where` da escrita: precisa ser um `where` único.
- Não use em model que o sistema escreve a cada operação (alto volume).

**Evento explícito** (`auditLogService.registrar`): para ação de negócio com nome próprio, efeito resumido ou model de alto volume.

```ts
await auditLogService.registrar(
  {
    acao: "PLANO_ALTERADO",
    entidade: "Plano",
    entidadeId: plano.id,
    dadosAntes: { nome: anterior.nome },
    dadosDepois: { nome: atualizado.nome },
  },
  tx,
);
```

Regras do projeto:

- **Dentro da transação de negócio:** passe o `tx` como client. Se a escrita automática também roda ali, envolva o corpo com `auditTxContext.run(tx, ...)`.
- **Autor e origem são automáticos:** `registrar` completa `usuario*`, `ip` e `userAgent` pela requisição (`audit-log-autor.ts`). Só informe o autor quando ele não é a sessão (e-mail digitado num login que falhou, aceite de convite antes de haver sessão).
- **A trava da cadeia** (`pg_advisory_xact_lock`) serializa as gravações: sem ela, duas concorrentes liam o mesmo último hash e a cadeia bifurcava. `createdAt` é estritamente crescente. Não grave em `audit_logs` por fora do `registrar`.
- **`registrar` não lança.** A falha vai para o Pino (`Falha ao registrar audit log`) e a operação segue. Não envolva em `try/catch` próprio.
- **Snapshot com PII/segredo de `User`:** passe por `snapshotsParaAuditoria(model, antes, depois)` antes de gravar (a captura automática já faz).
- **Verificação:** `verificarCadeia` lê as linhas cruas (`$queryRaw`) — pelo client com extensões a PII voltaria decifrada e o hash nunca bateria. Devolve `valida`, `quebradoEm`, `total` e `bifurcacoes`.
- **Webhook e cron:** `usuarioId` nulo; identifique a origem em `dadosDepois`.
- **Teste:** mocke `@/lib/services/audit-log.service` e confira `acao`, `dadosAntes/dadosDepois` e o client (`tx`). Exemplo da própria cadeia: `tests/services/audit-log.test.ts`.
- **Ao criar uma ação nova:** atualize a tabela de eventos em `auditoria.mdx` e o catálogo abaixo.

### Catálogo

✅ já registrado · ❌ falta registrar.

| Ação | Onde | Status |
| --- | --- | --- |
| Login com sucesso e falha | `auth/index.ts` (`LOGIN_SUCCESS`/`LOGIN_FAILED`) | ✅ |
| Cadastro | `(auth)/cadastro/_components/actions.ts` (`CADASTRO_REALIZADO`) | ✅ |
| Aceite de convite de membro | `empresa.service.ts` (`CONVITE_MEMBRO_EMPRESA_ACEITO`) | ✅ |
| Usuário, empresa, membro, papel, plano e permissões de plano (escritas) | `AUDITADOS` | ✅ automático |
| Senha/e-mail alterados | `AUDITADOS` (`User`, só registra que a senha mudou) | ✅ automático |

Ao adicionar um módulo (financeiro, pedidos, exportações...), inclua as linhas dele aqui e decida item a item o que entra, seguindo a regra geral.

## Checklist antes de fechar uma ação que grava

- A ação mexe em dinheiro, altera dado/configuração de outra pessoa, muda acesso ou exporta dados? Se sim, gera registro.
- O nome da ação segue `ENTIDADE_VERBO` no passado e está na tabela da doc e no catálogo?
- O ator vem da sessão (ou é `sistema` com a origem no snapshot)?
- O antes/depois traz só os campos relevantes, valores em string decimal, sem segredo, com a PII cifrada?
- O registro vai na mesma transação da operação?
- Existe teste que confirma o registro e a ausência de segredos?
