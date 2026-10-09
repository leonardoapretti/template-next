import "dotenv/config";

import { db } from "../lib/db";
import { seedAdmin } from "./seed-admin";

// Reset diário da demo pública: o template.next é exposto pra qualquer um
// testar sem cadastro prévio, então os dados criados por visitantes se
// acumulam. Este script esvazia todas as tabelas do schema `public` (exceto
// o controle de migrations do Prisma) e recria só o admin do seed.
async function main() {
  // Trava: o reset trunca o banco inteiro. Só roda onde o ambiente declara ser a
  // demo pública (ALLOW_DEMO_RESET=true no .env); num app derivado com dados
  // reais, a ausência da flag impede apagar tudo por engano.
  if (process.env.ALLOW_DEMO_RESET !== "true") {
    throw new Error("Reset recusado: defina ALLOW_DEMO_RESET=true apenas na demo pública.");
  }

  const tabelas = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;

  if (tabelas.length > 0) {
    const nomes = tabelas.map((t) => `"${t.tablename}"`).join(", ");
    await db.$executeRawUnsafe(`TRUNCATE TABLE ${nomes} RESTART IDENTITY CASCADE;`);
  }

  await seedAdmin(db);

  console.log("");
  console.log("✅ Banco de dados resetado (demo pública).");
}

main()
  .catch((error) => {
    console.error("❌ Erro ao resetar o banco de dados:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
