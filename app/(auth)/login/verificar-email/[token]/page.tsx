import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userService } from "@/lib/services/user.service";

type ConfirmarEmailPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function ConfirmarEmailPage({ params }: ConfirmarEmailPageProps) {
  const { token } = await params;

  const response = await userService.confirmarEmailContaPorToken(token);

  if (response.isError()) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl">Não foi possível confirmar seu e-mail</CardTitle>

              <p className="text-sm text-muted-foreground">
                O link usado para confirmar sua conta é inválido, expirou ou já foi utilizado.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div className="rounded-lg border bg-muted/40 p-4 text-left">
              <p className="text-sm font-medium text-foreground">O que você pode fazer agora?</p>

              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                <li>Solicitar um novo link de confirmação.</li>
                <li>Verificar se você abriu o link mais recente enviado por e-mail.</li>
                <li>Voltar para o login caso sua conta já tenha sido confirmada.</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">{response.getErrorMessage()}</p>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                render={<Link href="/login/verificar-email">Solicitar novo link</Link>}
                nativeButton={false}
              />

              <Button
                variant="outline"
                className="w-full"
                render={<Link href="/login">Voltar para o login</Link>}
                nativeButton={false}
              />
            </div>
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
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </div>

          <CardTitle className="text-2xl">E-mail confirmado com sucesso</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sua conta foi ativada. Agora você já pode acessar o sistema com seu e-mail e senha.
          </p>

          <Button
            className="w-full"
            render={<Link href="/login">Ir para o login</Link>}
            nativeButton={false}
          ></Button>
        </CardContent>
      </Card>
    </main>
  );
}
