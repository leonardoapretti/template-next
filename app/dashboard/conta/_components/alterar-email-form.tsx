"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alterarEmailAction } from "./actions";
import { type AlterarEmailFormSchema, alterarEmailSchema } from "./schema";

export function AlterarEmailForm() {
  const [enviado, setEnviado] = useState(false);

  const form = useForm<AlterarEmailFormSchema>({
    resolver: zodResolver(alterarEmailSchema),
    defaultValues: {
      senhaAtual: "",
      novoEmail: "",
    },
  });

  async function onSubmit(data: AlterarEmailFormSchema) {
    const result = await alterarEmailAction(data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível enviar o link de confirmação.");
      return;
    }

    setEnviado(true);
    form.reset();
  }

  if (enviado) {
    return (
      <p className="text-sm text-muted-foreground">
        Enviamos um link de confirmação para o novo e-mail informado. Seu e-mail só será alterado
        depois que você acessar esse link.
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Senha atual</Label>
        <Input autoComplete="current-password" type="password" {...form.register("senhaAtual")} />
        <FormErrorMessage error={form.formState.errors.senhaAtual} />
      </div>

      <div className="space-y-2">
        <Label>Novo e-mail</Label>
        <Input autoComplete="email" type="email" {...form.register("novoEmail")} />
        <FormErrorMessage error={form.formState.errors.novoEmail} />
      </div>

      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Enviando..." : "Enviar link de confirmação"}
      </Button>
    </form>
  );
}
