# AGENTS.md

## Comunicação

* Seja direto e objetivo.
* Não explique conceitos básicos ou óbvios, a menos que eu peça explicitamente.
* Não descreva passo a passo o que você acabou de alterar.
* Não mostre diffs no chat.
* Não reproduza trechos de código alterados no chat, salvo quando eu pedir explicitamente.
* Não liste arquivos alterados apenas para informar que foram alterados.
* Não faça resumos longos da implementação.
* Não explique cada decisão trivial tomada durante a implementação.
* Evite mensagens como:
  * "Aqui está o que eu alterei..."
  * "Principais mudanças..."
  * "O código agora..."
  * "Neste arquivo eu fiz..."
* Considere que eu estou acompanhando as alterações diretamente pelo VS Code e pelo Git.

Ao finalizar uma tarefa, prefira uma resposta curta neste formato:

* implementação concluída;
* testes/checks executados e respectivos resultados;
* algum problema, risco ou decisão importante que eu realmente precise saber.

Se não houver nada relevante além da implementação, responda apenas de forma curta, por exemplo:

> Implementado. `pnpm lint` e `pnpm typecheck` passaram.

## Forma de trabalhar

* Antes de alterar código, analise a implementação existente e siga os padrões já utilizados no projeto.
* Não crie abstrações, helpers, hooks, services, componentes ou arquivos novos sem necessidade real.
* Prefira modificar a implementação existente quando isso resultar em uma solução simples e coerente.
* Não faça refatorações não relacionadas à tarefa solicitada.
* Não altere comportamento fora do escopo da solicitação.
* Não renomeie arquivos, funções, componentes, variáveis ou rotas sem necessidade.
* Não altere formatação de arquivos inteiros quando apenas uma pequena região precisa mudar.
* Preserve a arquitetura existente, salvo quando ela impedir uma implementação correta.
* Antes de criar algo novo, procure se já existe implementação equivalente no projeto.
* Reutilize componentes, tipos, schemas, utilities, hooks e services existentes sempre que apropriado.
* Evite duplicação de lógica.

## Escopo

* Faça somente o que foi solicitado.
* Se encontrar problemas não relacionados, não os corrija automaticamente.
* Caso um problema não relacionado impeça a tarefa, informe-o de forma curta.
* Não adicione features extras "por conveniência".
* Não introduza mudanças preventivas ou especulativas sem necessidade.
* Não atualize dependências sem que isso seja necessário para a tarefa.
* Não altere arquivos de configuração sem necessidade.

## Código

* Priorize código simples, legível e previsível.
* Evite overengineering.
* Evite abstrações prematuras.
* Evite comentários explicando código óbvio.
* Adicione comentários somente quando explicarem uma regra de negócio, restrição incomum ou decisão que não seja evidente pelo próprio código.
* Não deixe código morto, código comentado, logs temporários ou TODOs desnecessários.
* Preserve tipagem forte.
* Evite `any` quando houver uma alternativa razoável.
* Não silencie erros do TypeScript, ESLint ou ferramentas equivalentes apenas para fazer o código passar.
* Não use casts perigosos apenas para contornar erros de tipagem.
* Não ignore exceções silenciosamente.

## Compatibilidade com o projeto

* Respeite as versões das bibliotecas já instaladas.
* Não assuma APIs de versões diferentes das presentes no projeto.
* Antes de usar uma API de biblioteca, verifique como essa biblioteca já é usada no repositório.
* Siga os padrões de imports, aliases, nomenclatura e estrutura de diretórios existentes.
* Mantenha consistência com o código ao redor em vez de impor um estilo diferente.

## Next.js / React

* Respeite a separação entre Server Components e Client Components.
* Não adicione `"use client"` sem necessidade.
* Prefira Server Components quando não houver necessidade de estado, effects ou APIs exclusivamente do cliente.
* Não mova processamento para o cliente quando puder permanecer no servidor.
* Evite `useEffect` para lógica que pode ser resolvida por renderização, props, server data ou event handlers.
* Não introduza estado duplicado ou derivado desnecessariamente.
* Preserve os padrões de App Router existentes no projeto.
* Para navegação, layouts, loading states, error boundaries, parallel routes e intercepting routes, utilize os recursos nativos do App Router quando apropriado.
* Evite soluções manuais quando o Next.js já possuir um mecanismo específico para o problema.

## Banco de dados e Prisma

* Não altere o schema Prisma fora do escopo da tarefa.
* Não crie migrations destrutivas sem necessidade.
* Nunca descarte dados existentes como forma de resolver uma migration.
* Não execute `prisma migrate reset` em bancos que possam conter dados importantes.
* Preserve nomes e relações existentes sempre que possível.
* Evite queries desnecessárias ou N+1.
* Reutilize transações quando uma operação precisar ser atômica.
* Nunca edite o SQL de uma migration já aplicada a um banco (local ou não) para corrigi-la. Uma vez aplicada, a migration está registrada no histórico do Prisma (`_prisma_migrations`) com um hash do conteúdo; editar o arquivo depois quebra esse histórico. Para corrigir, crie uma nova migration que desfaça ou ajuste o que for necessário.

## Segurança

* Nunca exponha secrets, tokens, senhas ou variáveis sensíveis.
* Não coloque credenciais diretamente no código.
* Não remova validações de autorização ou autenticação para simplificar uma implementação.
* Valide entradas em boundaries apropriados.
* Não confie exclusivamente em validação client-side para operações sensíveis.
* Preserve regras de autorização existentes.

## Tratamento de erros

* Não esconda erros.
* Preserve os padrões de tratamento de erro já existentes.
* Mensagens apresentadas ao usuário devem ser úteis, mas não devem expor detalhes internos ou informações sensíveis.
* Não adicione `try/catch` que apenas engole exceções.

## Testes e validação

Depois das alterações, execute os checks relevantes disponíveis no projeto.

Quando existirem, priorize:

1. testes relacionados à funcionalidade alterada;
2. typecheck;
3. lint.

Não rode `pnpm build` (nem `next build`) a menos que eu peça expressamente. É lento e não deve fazer parte do fluxo padrão de validação.

Não corrija erros preexistentes e não relacionados apenas para deixar todos os checks verdes.

Se um comando falhar por um problema anterior às suas alterações, informe isso de forma objetiva.

Não diga que algo funciona se não foi validado quando havia uma forma razoável de validar.

## Git

* Não faça commit sem que eu peça.
* Não faça push sem que eu peça.
* Não altere histórico Git.
* Não execute rebase, reset, force push ou operações destrutivas sem solicitação explícita.
* Não descarte alterações locais que não foram feitas por você.
* Considere que podem existir mudanças minhas ainda não commitadas no working tree.
* Não sobrescreva essas mudanças.

## Dependências

* Não instale novas bibliotecas quando uma solução razoável puder ser feita com as dependências existentes.
* Se uma nova dependência for realmente necessária, use uma biblioteca madura e compatível com o projeto.
* Não troque bibliotecas existentes apenas por preferência pessoal.

## Decisões ambíguas

Quando houver mais de uma implementação válida:

* escolha a opção mais simples;
* siga os padrões existentes no repositório;
* minimize o número de arquivos alterados;
* minimize mudanças de API;
* preserve compatibilidade.

Não interrompa a implementação para perguntar sobre decisões triviais que podem ser inferidas com segurança pelo código existente.

Pergunte apenas quando a decisão tiver impacto funcional relevante e não puder ser inferida do projeto ou da solicitação.

## Documentação

A documentação da aplicação está disponível em `lib/fumadocs/content/docs`

## Controle de acesso

As actions da aplicação devem ser protegidas com o sistema de controle de acesso por conta das permissões e dos planos dispoíveis na aplicação

## Resposta final

A resposta final deve ser curta.

Não inclua:

* diff;
* código que já foi aplicado;
* explicação linha por linha;
* lista detalhada das mudanças;
* tutorial sobre a implementação;
* descrição de arquivos que eu consigo visualizar no editor.

Inclua somente informações úteis para minha próxima decisão, como:

* tarefa concluída;
* validações executadas;
* erro de validação;
* migration necessária;
* variável de ambiente necessária;
* decisão arquitetural importante;
* risco ou comportamento que eu precise conhecer.

Exemplo ideal:

> Implementado.
> 
> `pnpm typecheck` e `pnpm lint` passaram.
> 
> Não foi necessário adicionar dependências.

Ou, quando houver um problema:

> Implementado.
> 
> O typecheck da alteração passou. O lint geral continua falhando em `arquivo-x.ts` por um erro preexistente não relacionado a esta tarefa.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

