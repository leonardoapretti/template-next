"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarPapelAction } from "./actions";

const NENHUM_VALOR = "__nenhum__";

const novoPapelSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do perfil."),
  copiarDeId: z.string(),
});

type NovoPapelFormSchema = z.infer<typeof novoPapelSchema>;

type NovoPapelFormProps = {
  papeisExistentes: { id: string; nome: string }[];
};

export function NovoPapelForm({ papeisExistentes }: NovoPapelFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<NovoPapelFormSchema>({
    resolver: zodResolver(novoPapelSchema),
    defaultValues: { nome: "", copiarDeId: NENHUM_VALOR },
  });

  async function onSubmit(data: NovoPapelFormSchema) {
    const result = await criarPapelAction({
      nome: data.nome,
      copiarDeId: data.copiarDeId === NENHUM_VALOR ? undefined : data.copiarDeId,
    });

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível criar o perfil.");
      return;
    }

    toast.success("Perfil criado.");
    form.reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="size-4" />
            Novo perfil
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo perfil</DialogTitle>
          <DialogDescription>
            Dê um nome ao perfil e, se quiser, comece a partir das permissões de um já existente.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input {...form.register("nome")} placeholder="Ex.: Financeiro" />
            <FormErrorMessage error={form.formState.errors.nome} />
          </div>

          <Controller
            control={form.control}
            name="copiarDeId"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Copiar permissões de</Label>
                <Select name={field.name} onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value={NENHUM_VALOR}>Nenhum (sem permissões)</SelectItem>
                    {papeisExistentes.map((papel) => (
                      <SelectItem key={papel.id} value={papel.id}>
                        {papel.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <DialogFooter>
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? "Criando..." : "Criar perfil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
