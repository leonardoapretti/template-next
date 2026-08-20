"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function JaLogadoToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jaLogado = searchParams.get("jaLogado");
  const jaExibiu = useRef(false);

  useEffect(() => {
    if (jaLogado !== "1" || jaExibiu.current) {
      return;
    }

    jaExibiu.current = true;

    toast.error("Usuário já está logado.", {
      description: "Saia para criar uma nova conta.",
    });

    router.replace("/dashboard");
  }, [jaLogado, router]);

  return null;
}
