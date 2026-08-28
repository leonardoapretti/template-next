import "dotenv/config";

import { db } from "../lib/db";
import { seedAdmin } from "./seed-admin";

async function main() {
  await seedAdmin(db);
  console.log("");
  console.log("✅ Seed finalizado com sucesso.");
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
