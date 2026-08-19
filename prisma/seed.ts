import bcrypt from "bcryptjs";
import "dotenv/config";

import type { Prisma } from "../generated/prisma/client";
import { db } from "../lib/db";
import type { SemCamposHash } from "../lib/services/crypto/tipos";

const SENHA_PADRAO = "senha123";
const ADMIN_EMAIL = "admin@example.com";

async function main() {
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

  console.log("✅ Seed finalizado com sucesso.");
  console.log("");
  console.log("Admin:");
  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Senha: ${SENHA_PADRAO}`);
}

main()
  .catch((error) => {
    console.error("❌ Erro ao executar seed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
