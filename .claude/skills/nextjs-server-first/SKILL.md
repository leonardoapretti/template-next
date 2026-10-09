---
name: nextjs-server-first
description: Use ao criar ou revisar qualquer page/layout/component do App Router neste projeto — decide se algo deve ser Server ou Client Component, e onde colocar "use client".
---

# Server-first no App Router

Regra do projeto (`AGENTS.md`): a aplicação deve ser **substancialmente server-side**. Só o trecho que realmente precisa de interação — e usa hooks pra isso — deve ser client-side.

## Regra prática

1. **Toda page é Server Component por padrão.** Ela busca dados (`await`, services, `getAccessContext()`), decide redirects, e renderiza.
2. Se uma parte da tela precisa de estado, evento de UI (`onClick`, `onChange`), `useEffect`, ou uma API exclusiva do browser (`localStorage`, `window`, hooks de formulário), **extraia só essa parte** para um componente separado com `"use client"` no topo — nunca marque a page inteira como client por causa de um botão ou um formulário.
3. Nunca use `useEffect` para algo que renderização, props, dado do servidor ou um event handler já resolvem.
4. Nunca duplique ou derive estado client que já existe no servidor (ex.: não guarde em `useState` um valor que já veio pronto via prop de uma leitura server-side).
5. Prefira os mecanismos nativos do App Router (layouts, `loading.tsx`, `error.tsx`, parallel/intercepting routes) a soluções manuais equivalentes.

## Padrão real do projeto

Uma page/layout `async` no server chama serviços e passa o resultado como prop pros componentes client que realmente precisam de interação:

```
app/fale-conosco/page.tsx                    ← Server: renderiza a página
  └─ app/fale-conosco/fale-conosco-form.tsx  ← "use client": useForm, submit, toasts

app/dashboard/layout.tsx                     ← Server: auth(), redirect
  └─ components/sidebar/layout.tsx           ← Server: getAccessContext(), cookie da sidebar
       └─ components/sidebar/nav-main.tsx    ← "use client": estado de seções abertas, flyout
```

Ao adicionar uma feature nova, siga o mesmo corte: a `page.tsx`/`layout.tsx` fica no server; qualquer pedaço interativo vira um arquivo próprio em `_components/` com `"use client"` só nele.

## Checklist antes de marcar algo como `"use client"`

- O componente realmente usa `useState`/`useEffect`/`useForm`/`onClick` (ou similar), ou só está sendo marcado "pra garantir"?
- Dá pra mover essa lógica pra um Server Component (renderização condicional, prop, ou um Server Action chamado por um form) em vez de um hook?
- Se só uma parte pequena da árvore precisa ser client, ela está isolada num componente próprio, ou a marcação subiu pra um ancestral maior do que precisava?
