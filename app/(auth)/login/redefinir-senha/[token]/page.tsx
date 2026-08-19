import { KeyRound, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userService } from "@/lib/services/user.service";
import { RedefinirSenhaForm } from "./_components/redefinir-senha-form";

type RedefinirSenhaPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function RedefinirSenhaPage({ params }: RedefinirSenhaPageProps) {
  const { token } = await params;

  const response = await userService.verificarTokenAlteracaoSenha(token);

  if (response.isError()) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl">Não foi possível alterar sua senha</CardTitle>

              <p className="text-sm text-muted-foreground">
                O link usado é inválido, expirou ou já foi utilizado.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <p className="text-sm text-muted-foreground">{response.getErrorMessage()}</p>

            <Button
              className="w-full"
              render={<Link href="/login">Voltar para o login</Link>}
              nativeButton={false}
            />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-7" aria-hidden="true" />
          </div>

          <CardTitle className="text-2xl">Defina sua nova senha</CardTitle>

          <p className="text-sm text-muted-foreground">
            Olá, {response.data.usuario.nome}. Escolha uma nova senha para sua conta.
          </p>
        </CardHeader>

        <CardContent>
          <RedefinirSenhaForm token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
