"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "./ui/button";

export default function LogOutBtn() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch("/api/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      className="flex w-full items-center gap-2"
      disabled={isPending}
      onClick={logout}
    >
      <LogOutIcon className="size-4" />
      {isPending ? "Saindo..." : "Sair"}
    </Button>
  );
}
