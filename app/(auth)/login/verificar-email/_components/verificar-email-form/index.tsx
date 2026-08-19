"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import reenviarEmailConfirmacaoAction from "./actions";
import { type VerificarEmailSchema, verificarEmailSchema } from "./schema";

type VerificarEmailFormProps = {
  email?: string;
};

export default function VerificarEmailForm({ email }: VerificarEmailFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<VerificarEmailSchema>({
    defaultValues: {
      email: email ?? "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(verificarEmailSchema),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  function onSubmit(data: VerificarEmailSchema) {
    startTransition(async () => {
      const result = await reenviarEmailConfirmacaoAction(data);

      if (!result.success) {
        toast.error(result.errorMessage ?? "Não foi possível reenviar o link.");
        return;
      }

      toast.success(
        "Se existir uma conta com este e-mail, enviaremos um novo link de confirmação.",
      );
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            type="email"
            placeholder="seu@email.com"
            disabled={isPending}
            aria-invalid={!!errors.email}
            className="pl-9"
            {...register("email")}
          />
        </div>

        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !isValid}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Reenviando...
          </>
        ) : (
          "Reenviar link de confirmação"
        )}
      </Button>
    </form>
  );
}
