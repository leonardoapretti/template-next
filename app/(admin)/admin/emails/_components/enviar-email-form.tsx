"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enviarEmailAction } from "./actions";
import { type EnviarEmailFormSchema, enviarEmailSchema } from "./schema";

export function EnviarEmailForm() {
  const form = useForm<EnviarEmailFormSchema>({
    resolver: zodResolver(enviarEmailSchema),
    defaultValues: {
      destinatario: "",
      assunto: "",
      corpo: "",
    },
  });

  async function onSubmit(data: EnviarEmailFormSchema) {
    const result = await enviarEmailAction(data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível enviar o e-mail.");
      return;
    }

    toast.success("E-mail enviado com sucesso.");
    form.reset();
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Destinatário</Label>
        <Input {...form.register("destinatario")} type="email" placeholder="usuario@email.com" />
        <FormErrorMessage error={form.formState.errors.destinatario} />
      </div>

      <div className="space-y-2">
        <Label>Assunto</Label>
        <Input {...form.register("assunto")} />
        <FormErrorMessage error={form.formState.errors.assunto} />
      </div>

      <div className="space-y-2">
        <Label>Corpo do e-mail</Label>
        <Textarea {...form.register("corpo")} rows={8} />
        <FormErrorMessage error={form.formState.errors.corpo} />
      </div>

      <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Enviando..." : "Enviar e-mail"}
      </Button>
    </form>
  );
}
