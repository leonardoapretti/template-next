"use client";

import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { criarContatoAction } from "./actions";
import { type FaleConoscoFormSchema, faleConoscoSchema } from "./schema";

export function FaleConoscoForm() {
  const [enviado, setEnviado] = useState(false);
  const form = useForm<FaleConoscoFormSchema>({
    resolver: zodResolver(faleConoscoSchema),
    defaultValues: {
      nome: "",
      email: "",
      mensagem: "",
    },
  });

  async function onSubmit(data: FaleConoscoFormSchema) {
    const result = await criarContatoAction(data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível enviar sua mensagem.");
      return;
    }

    setEnviado(true);
    form.reset();
  }

  if (enviado) {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-sm font-medium text-foreground">Mensagem enviada.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Obrigado pelo contato, retornaremos em breve.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Nome completo</Label>
        <Input {...form.register("nome")} autoComplete="name" />
        <FormErrorMessage error={form.formState.errors.nome} />
      </div>

      <div className="space-y-2">
        <Label>E-mail</Label>
        <Input {...form.register("email")} autoComplete="email" type="email" />
        <FormErrorMessage error={form.formState.errors.email} />
      </div>

      <div className="space-y-2">
        <Label>Mensagem</Label>
        <Textarea {...form.register("mensagem")} rows={6} />
        <FormErrorMessage error={form.formState.errors.mensagem} />
      </div>

      <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
