import { getAccessContext } from "./context";

export async function getUsuarioAtualId() {
  return (await getAccessContext()).usuarioId;
}

export type UsuarioAtualContexto = {
  usuarioId: string;
  isAdmin: boolean;
  acessoGlobal: boolean;
};

export async function getUsuarioAtualContexto(): Promise<UsuarioAtualContexto> {
  const ctx = await getAccessContext();

  return {
    usuarioId: ctx.usuarioId,
    isAdmin: ctx.isAdmin,
    acessoGlobal: ctx.isAdmin,
  };
}
