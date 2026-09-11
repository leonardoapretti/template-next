"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarPlanoAction } from "./actions";

const novoPlanoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, "Informe um código.")
    .regex(/^[A-Z0-9_]+$/, "Use apenas letras maiúsculas, números e underline."),
  nome: z.string().trim().min(2, "Informe o nome do plano."),
});

type NovoPlanoFormSchema = z.infer<typeof novoPlanoSchema>;

export function NovoPlanoForm() {
  const router = useRouter();
  const form = useForm<NovoPlanoFormSchema>({
    resolver: zodResolver(novoPlanoSchema),
    defaultValues: { codigo: "", nome: "" },
  });

  async function onSubmit(data: NovoPlanoFormSchema) {
    const result = await criarPlanoAction(data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível criar o plano.");
      return;
    }

    toast.success("Plano criado.");
    form.reset();
    router.refresh();
  }

  return (
    <form className="flex flex-wrap items-end gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Código</Label>
        <Input {...form.register("codigo")} placeholder="Ex.: BASICO" />
        <FormErrorMessage error={form.formState.errors.codigo} />
      </div>

      <div className="space-y-2">
        <Label>Nome</Label>
        <Input {...form.register("nome")} placeholder="Ex.: Básico" />
        <FormErrorMessage error={form.formState.errors.nome} />
      </div>

      <Button disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Criando..." : "Novo plano"}
      </Button>
    </form>
  );
}
