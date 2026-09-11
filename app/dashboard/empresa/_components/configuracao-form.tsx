"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { atualizarConfiguracaoAction } from "./actions";
import { type AtualizarConfiguracaoFormSchema, atualizarConfiguracaoSchema } from "./schema";

export function ConfiguracaoForm({ nome }: { nome: string }) {
  const router = useRouter();

  const form = useForm<AtualizarConfiguracaoFormSchema>({
    resolver: zodResolver(atualizarConfiguracaoSchema),
    defaultValues: { nome },
  });

  async function onSubmit(data: AtualizarConfiguracaoFormSchema) {
    const result = await atualizarConfiguracaoAction(data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível salvar a configuração.");
      return;
    }

    toast.success("Configuração salva.");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Nome da empresa</Label>
        <Input {...form.register("nome")} placeholder="Ex.: Empresa Alfa Ltda" />
        <FormErrorMessage error={form.formState.errors.nome} />
      </div>

      <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
