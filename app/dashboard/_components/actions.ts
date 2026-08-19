"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access-control";
import { db } from "@/lib/db";
import { DataBaseResponse } from "@/lib/services/config/database-response";

export async function promoverAAdminAction() {
  const ctx = await getAccessContext().catch(() => null);

  if (!ctx) {
    return DataBaseResponse.error({
      code: "AUTHENTICATION_REQUIRED",
      message: "Faça login para continuar.",
    }).serialize();
  }

  await db.user.update({
    where: { id: ctx.usuarioId },
    data: { isAdmin: true },
  });

  revalidatePath("/dashboard");

  return DataBaseResponse.success({ isAdmin: true }).serialize();
}
