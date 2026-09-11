"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarEmpresaAction } from "./actions";
import { type CriarEmpresaFormSchema, criarEmpresaSchema } from "./schema";

export function CriarEmpresaForm() {
  const router = useRouter();

  const form = useForm<CriarEmpresaFormSchema>({
    resolver: zodResolver(criarEmpresaSchema),
    defaultValues: {
      nome: "",
    },
  });

  async function onSubmit(data: CriarEmpresaFormSchema) {
    const result = await criarEmpresaAction(data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível criar a empresa.");
      return;
    }

    toast.success("Empresa criada com sucesso.");
    router.push("/dashboard/empresa");
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Nome da empresa</Label>
        <Input {...form.register("nome")} placeholder="Ex.: Empresa Alfa Ltda" />
        <FormErrorMessage error={form.formState.errors.nome} />
      </div>

      <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Criando..." : "Criar empresa"}
      </Button>
    </form>
  );
}
