"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "./actions";
import { loginSchema, type LoginSchema } from "./schema";

export function LoginForm({ emailPadrao, retorno }: { emailPadrao?: string; retorno?: string }) {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: emailPadrao ?? "", password: "" },
  });

  async function onSubmit(data: LoginSchema) {
    const result = await loginAction({ ...data, retorno });

    // Em caso de sucesso a action já redireciona (lança redirect()) — só
    // chega aqui em caso de falha, então os campos não são limpos.
    if (result && !result.success) {
      toast.error(result.errorMessage);
    }
  }

  return (
    <div className="w-100 max-w-sm">
      {/* Cabeçalho */}
      <div className="mb-10">
        <h1 className="text-2xl font-medium tracking-tight text-foreground">Bem-vindo de volta</h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Entre com sua conta para continuar.
        </p>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
            Email
          </Label>

          <div className="relative">
            <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="seu@email.com"
              className="h-11 pl-9 text-sm"
              required
              {...form.register("email")}
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
              Senha
            </Label>

            <Link href="#" className="text-xs text-primary underline-offset-4 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          <div className="relative">
            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 pl-9 text-sm"
              required
              {...form.register("password")}
            />
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={form.formState.isSubmitting} className="mt-2 h-11 w-full">
          {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <Button
        className="mt-3 h-11 w-full"
        nativeButton={false}
        variant="outline"
        render={
          <Link href={retorno ? `/cadastro?retorno=${encodeURIComponent(retorno)}` : "/cadastro"}>
            Cadastre-se
          </Link>
        }
      />

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        Problemas para acessar? <span className="text-primary">Fale com o administrador.</span>
      </p>
    </div>
  );
}
