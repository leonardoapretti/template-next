"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getAccessContext } from "@/lib/access-control";
import { db } from "@/lib/db";
import { userTag } from "@/lib/services/config/cache-tags";
import { DataBaseResponse } from "@/lib/services/config/database-response";
import { routes } from "@/lib/utils/routes";

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

  updateTag(userTag(ctx.usuarioId));
  revalidatePath(routes.dashboard.home);

  return DataBaseResponse.success({ isAdmin: true }).serialize();
}
