"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ACESSO_NEGADO_STORAGE_KEY } from "./acesso-negado-toast";
import { promoverAAdminAction } from "./actions";

export function PromoverAdminButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function promover() {
    startTransition(async () => {
      const result = await promoverAAdminAction();

      if (!result.success) {
        toast.error(result.errorMessage ?? "Não foi possível promover o usuário.");
        return;
      }

      toast.success("Usuário promovido a admin.");
      sessionStorage.removeItem(ACESSO_NEGADO_STORAGE_KEY);
      router.refresh();
    });
  }

  return (
    <Button variant="outline" disabled={isPending} onClick={promover}>
      {isPending ? "Promovendo..." : "Promover meu usuário a admin"}
    </Button>
  );
}
