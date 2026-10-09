"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/utils/routes";
import { cadastrarAction } from "./actions";
import { type CadastroFormSchema, cadastroSchema } from "./schema";

export function CadastroForm({
  conviteToken,
  emailPadrao,
  retorno,
}: {
  conviteToken?: string;
  emailPadrao?: string;
  retorno?: string;
}) {
  const form = useForm<CadastroFormSchema>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { nome: "", email: emailPadrao ?? "", senha: "", confirmarSenha: "" },
  });

  async function onSubmit(data: CadastroFormSchema) {
    const result = await cadastrarAction({ ...data, retorno, conviteToken });

    // Em caso de sucesso a action já redireciona (lança redirect()) — só
    // chega aqui em caso de falha, então os campos não são limpos.
    if (result && !result.success) {
      toast.error(result.errorMessage);
    }
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
        <Campo
          label="Nome completo"
          error={form.formState.errors.nome?.message}
          icon={<UserRound />}
        >
          <Input autoComplete="name" placeholder="Seu nome" {...form.register("nome")} />
        </Campo>

        <Campo label="E-mail" error={form.formState.errors.email?.message} icon={<Mail />}>
          <Input
            autoComplete="email"
            type="email"
            placeholder="seu@email.com"
            readOnly={Boolean(conviteToken)}
            {...form.register("email")}
          />
        </Campo>

        <Campo label="Senha" error={form.formState.errors.senha?.message} icon={<Lock />}>
          <Input
            autoComplete="new-password"
            type="password"
            minLength={8}
            {...form.register("senha")}
          />
        </Campo>

        <Campo
          label="Confirmar senha"
          error={form.formState.errors.confirmarSenha?.message}
          icon={<Lock />}
        >
          <Input autoComplete="new-password" type="password" {...form.register("confirmarSenha")} />
        </Campo>

        <Button className="mt-2 h-11 w-full" disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? "Criando conta..." : "Cadastrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já possui conta?{" "}
        <Link
          className="text-primary hover:underline"
          href={
            retorno
              ? `${routes.auth.login}?retorno=${encodeURIComponent(retorno)}`
              : routes.auth.login
          }
        >
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
  error?: string;
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
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
