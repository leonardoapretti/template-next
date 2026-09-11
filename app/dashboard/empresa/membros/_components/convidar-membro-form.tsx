"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { convidarMembroAction } from "./actions";
import { type ConvidarMembroFormSchema, convidarMembroSchema } from "./schema";

type ConvidarMembroFormProps = {
  roles: { id: string; nome: string }[];
};

export function ConvidarMembroForm({ roles }: ConvidarMembroFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<ConvidarMembroFormSchema>({
    resolver: zodResolver(convidarMembroSchema),
    defaultValues: {
      email: "",
      roleId: "",
    },
  });

  async function onSubmit(data: ConvidarMembroFormSchema) {
    const result = await convidarMembroAction(data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível enviar o convite.");
      return;
    }

    toast.success("Convite enviado por e-mail.");
    form.reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button>
            <UserPlusIcon className="size-4" />
            Adicionar membro
          </Button>
        }
      />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar membro</DialogTitle>
          <DialogDescription>
            Envia um convite por e-mail para o usuário entrar nesta empresa com o perfil escolhido.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>E-mail do convidado</Label>
            <Input {...form.register("email")} placeholder="usuario@email.com" type="email" />
            <FormErrorMessage error={form.formState.errors.email} />
          </div>

          <Controller
            control={form.control}
            name="roleId"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select name={field.name} onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger aria-invalid={!!fieldState.error} className="w-full">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorMessage error={fieldState.error} />
              </div>
            )}
          />

          <DialogFooter>
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
