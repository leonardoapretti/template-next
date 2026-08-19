"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { type FieldError, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorMessage } from "@/components/form-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastrarAction } from "./actions";
import { type CadastroFormSchema, cadastroSchema } from "./schema";

export function CadastroForm() {
  const router = useRouter();

  const form = useForm<CadastroFormSchema>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  async function onSubmit(data: CadastroFormSchema) {
    const result = await cadastrarAction(data);

    if (!result.success) {
      toast.error(result.errorMessage ?? "Não foi possível criar sua conta.");
      return;
    }

    router.push(result.redirectTo ?? "/login/verificar-email");
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">Crie sua conta</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Crie sua conta para começar a testar o sistema.
        </p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <Campo label="Nome completo" error={form.formState.errors.nome} icon={<UserRound />}>
          <Input autoComplete="name" {...form.register("nome")} placeholder="Seu nome" />
        </Campo>

        <Campo label="E-mail" error={form.formState.errors.email} icon={<Mail />}>
          <Input
            autoComplete="email"
            type="email"
            {...form.register("email")}
            placeholder="seu@email.com"
          />
        </Campo>

        <Campo label="Senha" error={form.formState.errors.senha} icon={<Lock />}>
          <Input autoComplete="new-password" type="password" {...form.register("senha")} />
        </Campo>

        <Campo label="Confirmar senha" error={form.formState.errors.confirmarSenha} icon={<Lock />}>
          <Input autoComplete="new-password" type="password" {...form.register("confirmarSenha")} />
        </Campo>

        <Button className="mt-2 h-11 w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Criando conta..." : "Cadastrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já possui conta?{" "}
        <Link className="text-primary hover:underline" href="/login">
          Entrar
        </Link>
      </p>
    </div>
  );
}

function Campo({
  label,
  error,
  icon,
  children,
}: {
  label: string;
  error?: FieldError;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {icon && (
          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">
            {icon}
          </span>
        )}
        <div className={icon ? "[&>input]:pl-9" : undefined}>{children}</div>
      </div>
      <FormErrorMessage error={error} />
    </div>
  );
}
