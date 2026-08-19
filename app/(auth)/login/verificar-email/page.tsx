import { MailCheck, MailQuestion, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { userService } from "@/lib/services/user.service";
import VerificarEmailForm from "./_components/verificar-email-form";

type VerificarEmailPageProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export default async function VerificarEmailPage({ searchParams }: VerificarEmailPageProps) {
  const session = await auth();
  const params = await searchParams;
  const email = params?.email;
  if (session?.user.id) {
    const usuarioIsEmailVerificado = await userService.usuarioIsEmailVerificado(session?.user.id);
    if (usuarioIsEmailVerificado) {
      redirect("/");
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="size-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl">Confirme seu e-mail</CardTitle>

              <CardDescription className="text-base">
                Antes de acessar o sistema, precisamos confirmar que este e-mail pertence a você.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg border bg-background p-4">
              <div className="flex gap-3">
                <MailQuestion className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">Como confirmar sua conta?</p>

                  <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
                    <li>Acesse a caixa de entrada do seu e-mail.</li>
                    <li>Procure pela mensagem de confirmação da conta.</li>
                    <li>Clique no link enviado para ativar seu acesso.</li>
                  </ol>

                  {email ? (
                    <p className="pt-2 text-muted-foreground">
                      O link foi enviado para{" "}
                      <span className="font-medium text-foreground">{email}</span>.
                    </p>
                  ) : null}

                  <p className="text-muted-foreground">
                    Caso não encontre o e-mail, verifique também a caixa de spam ou lixo eletrônico.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <RefreshCcw className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

                <div className="space-y-1">
                  <h2 className="text-sm font-medium">Não recebeu o link?</h2>

                  <p className="text-sm text-muted-foreground">
                    Informe seu e-mail abaixo para receber um novo link de confirmação.
                  </p>
                </div>
              </div>

              <VerificarEmailForm />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Já confirmou sua conta?{" "}
              <Button
                variant="link"
                className="h-auto p-0"
                render={<Link href="/login">Voltar para o login</Link>}
                nativeButton={false}
              ></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
