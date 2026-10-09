"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/utils/routes";
import { aceitarConviteAction } from "./actions";

export function AceitarConviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await aceitarConviteAction(token);
    setLoading(false);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível aceitar o convite.");
      return;
    }

    toast.success("Convite aceito.");
    router.push(routes.empresa.home);
  }

  return (
    <Button disabled={loading} onClick={handleClick}>
      {loading ? "Aceitando..." : "Aceitar convite"}
    </Button>
  );
}
