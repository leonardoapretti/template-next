"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginAction } from "./actions";
import { type LoginSchema, loginSchema } from "./schema";

export function LoginForm({ retorno }: { retorno?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginSchema) {
    setError(null);

    const result = await loginAction(data);

    if (!result?.success) {
      const message = result?.errorMessage ?? "Erro ao realizar login.";

      if (result?.redirectTo) {
        toast.error(message);
        return router.push(result.redirectTo);
      }

      toast.error(message);
      setError(message);
      return;
    }

    router.push(retorno?.startsWith("/") ? retorno : (result.redirectTo ?? "/"));
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              {...register("email")}
            />
          </div>

          {errors.email && (
            <p className="pt-0.5 text-xs text-destructive">{errors.email.message}</p>
          )}
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
              {...register("password")}
            />
          </div>

          {errors.password && (
            <p className="pt-0.5 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Erro geral */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <Button type="submit" disabled={isSubmitting} className="mt-2 h-11 w-full">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <Button
        className="mt-3 h-11 w-full"
        nativeButton={false}
        variant="outline"
        render={<Link href="/cadastro">Cadastre-se</Link>}
      />

      <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
        Problemas para acessar? <span className="text-primary">Fale com o administrador.</span>
      </p>
    </div>
  );
}
