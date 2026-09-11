"use client";

import { Lock, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cadastrarAction } from "./actions";

export function CadastroForm({
  conviteToken,
  emailPadrao,
  retorno,
}: {
  conviteToken?: string;
  emailPadrao?: string;
  retorno?: string;
}) {
  const [state, formAction, pending] = useActionState(cadastrarAction, null);

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">Crie sua conta</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Crie sua conta para começar a testar o sistema.
        </p>
      </div>

      <form className="space-y-4" action={formAction}>
        <input type="hidden" name="retorno" value={retorno ?? ""} />
        <input type="hidden" name="conviteToken" value={conviteToken ?? ""} />

        <Campo label="Nome completo" error={state?.fieldErrors?.nome?.[0]} icon={<UserRound />}>
          <Input id="nome" name="nome" autoComplete="name" placeholder="Seu nome" required />
        </Campo>

        <Campo label="E-mail" error={state?.fieldErrors?.email?.[0]} icon={<Mail />}>
          <Input
            id="email"
            name="email"
            autoComplete="email"
            type="email"
            placeholder="seu@email.com"
            defaultValue={emailPadrao}
            readOnly={Boolean(conviteToken)}
            required
          />
        </Campo>

        <Campo label="Senha" error={state?.fieldErrors?.senha?.[0]} icon={<Lock />}>
          <Input
            id="senha"
            name="senha"
            autoComplete="new-password"
            type="password"
            minLength={8}
            required
          />
        </Campo>

        <Campo
          label="Confirmar senha"
          error={state?.fieldErrors?.confirmarSenha?.[0]}
          icon={<Lock />}
        >
          <Input
            id="confirmarSenha"
            name="confirmarSenha"
            autoComplete="new-password"
            type="password"
            required
          />
        </Campo>

        {state?.errorMessage && !state.fieldErrors && (
          <div className="rounded-md bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{state.errorMessage}</p>
          </div>
        )}

        <Button className="mt-2 h-11 w-full" disabled={pending} type="submit">
          {pending ? "Criando conta..." : "Cadastrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já possui conta?{" "}
        <Link
          className="text-primary hover:underline"
          href={retorno ? `/login?retorno=${encodeURIComponent(retorno)}` : "/login"}
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
