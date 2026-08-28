import bcrypt from "bcryptjs";
import type { Prisma } from "../generated/prisma/client";
import type { DbClient } from "../lib/db";
import type { SemCamposHash } from "../lib/services/crypto/tipos";

const SENHA_PADRAO = "senha123";
const ADMIN_EMAIL = "admin@example.com";

export async function seedAdmin(db: DbClient) {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 12);

  await db.user.upsert({
    where: {
      email: ADMIN_EMAIL,
    } as Prisma.UserWhereUniqueInput,
    update: {
      nome: "Admin",
      senha: senhaHash,
      emailVerificado: new Date(),
      isAdmin: true,
    } satisfies SemCamposHash<Prisma.UserUpdateInput> as Prisma.UserUpdateInput,
    create: {
      nome: "Admin",
      email: ADMIN_EMAIL,
      senha: senhaHash,
      emailVerificado: new Date(),
      isAdmin: true,
    } satisfies SemCamposHash<Prisma.UserCreateInput> as Prisma.UserCreateInput,
  });

  console.log("Admin:");
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Senha: ${SENHA_PADRAO}`);
}
