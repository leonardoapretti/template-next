import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AuthenticationRequiredError } from "./errors";

export type AccessContext = {
  usuarioId: string;
  isAdmin: boolean;
};

export async function getAccessContext(): Promise<AccessContext> {
  const session = await auth();
  const usuarioId = session?.user?.id;

  if (!usuarioId) {
    throw new AuthenticationRequiredError();
  }

  const usuario = await db.user.findUnique({
    where: {
      id: usuarioId,
    },
    select: {
      id: true,
      isAdmin: true,
    },
  });

  if (!usuario) {
    throw new AuthenticationRequiredError("Sessão inválida.");
  }

  return {
    usuarioId: usuario.id,
    isAdmin: usuario.isAdmin,
  };
}
