"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redefinirSenhaAction } from "./actions";
import { type RedefinirSenhaFormSchema, redefinirSenhaSchema } from "./schema";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const router = useRouter();

  const form = useForm<RedefinirSenhaFormSchema>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: {
      senha: "",
      confirmarSenha: "",
    },
  });

  async function onSubmit(data: RedefinirSenhaFormSchema) {
    const result = await redefinirSenhaAction(token, data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível alterar sua senha.");
      return;
    }

    toast.success("Senha alterada. Faça login novamente.");
    router.push(result.redirectTo ?? "/login");
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Nova senha</Label>
        <Input autoComplete="new-password" type="password" {...form.register("senha")} />
        <FormErrorMessage error={form.formState.errors.senha} />
      </div>

      <div className="space-y-2">
        <Label>Confirmar nova senha</Label>
        <Input autoComplete="new-password" type="password" {...form.register("confirmarSenha")} />
        <FormErrorMessage error={form.formState.errors.confirmarSenha} />
      </div>

      <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
