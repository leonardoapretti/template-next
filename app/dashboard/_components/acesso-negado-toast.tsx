"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { routes } from "@/lib/utils/routes";

export const ACESSO_NEGADO_STORAGE_KEY = "acesso-negado-admin";

export function AcessoNegadoToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const acessoNegado = searchParams.get("acessoNegado");
  const jaExibiu = useRef(false);

  useEffect(() => {
    if (acessoNegado !== "admin" || jaExibiu.current) {
      return;
    }

    jaExibiu.current = true;

    toast.error("Acesso exclusivo para administradores.", {
      description: "Promova seu usuário a admin abaixo para acessar essa área.",
    });

    sessionStorage.setItem(ACESSO_NEGADO_STORAGE_KEY, "1");
    router.replace(routes.dashboard.home);
  }, [acessoNegado, router]);

  return null;
}
