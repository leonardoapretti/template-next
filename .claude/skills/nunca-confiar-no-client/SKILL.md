---
name: nunca-confiar-no-client
description: Use ao criar ou alterar qualquer Server Action, route handler ou service que receba dados do navegador — empresa, membros, papéis, permissões, plano, agenda, status. Tudo o que o client manda é entrada não confiável; o servidor revalida e decide antes de gravar.
---

# Nunca confiar no que vem do client

O navegador (formulário, `useState`, campo escondido, o que a tela "mostrou") é território do usuário: pode estar desatualizado, ter um bug ou ser adulterado. **Toda Server Action e todo service que grava dado revalida no servidor.** A tela só mostra; quem decide é o servidor.

## Regras

1. **Valores derivados nunca vêm do client.** Empresa ativa, papel, permissões, plano e flags como `isAdmin` vêm da sessão/`getAccessContext()`, nunca de campo do formulário. Se o client mandar, é ignorado.
2. **O client manda só escolhas e identificadores** (ids, texto digitado, datas). O servidor confere que cada id existe, **pertence à empresa do contexto** e é permitido para o papel.
3. **Dono e permissão no servidor.** Recurso buscado por `id` **e** `empresaId` do contexto no `where`; ação restrita passa pelo guard (`assertCurrentUserCan`, `assertAdminAction`, `assertEmpresaAction` — skill `controle-de-acesso`). Esconder o botão não é proteção.
4. **Papel e plano limitam o que se concede.** Quem edita papel/membro não pode conceder permissão que o plano da empresa não inclui, nem se promover. Reconferir no servidor.
5. **Estado atual no servidor.** Convite expirado/usado, membro removido, evento excluído: reconferir dentro da transação, não confiar na tela que ainda mostra o estado antigo.
6. **Concorrência.** Conferir e depois gravar não basta com duas requisições simultâneas: a condição vai no próprio `update` (`where: { id, empresaId, ... }`) ou o dado é relido dentro de `db.$transaction`.
7. **Validar a entrada no limite** (schema zod na action, `safeParse`) *e* de novo no service, que não pode depender de a action ter validado.
8. **Token de ação** (convite, reset) vem na URL: validar existência, tipo, expiração e uso único no servidor.

## Checklist antes de fechar uma action que grava

- Algum campo de `input.*` vai para o banco sem ser validado ou reclampado?
- Cada id recebido foi conferido (existe, mesma empresa, ativo)?
- Empresa/usuário vêm da sessão e não do formulário?
- Há guard de permissão/plano na action?
- Duas requisições ao mesmo tempo quebram a regra?
- Existe teste com valor adulterado, id de outra empresa e usuário sem permissão? (modelo: `tests/actions/*`)
