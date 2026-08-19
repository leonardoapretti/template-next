import { Activity } from "lucide-react";
import type { Metadata } from "next";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Login | Template",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; retorno?: string }>;
}) {
  const { callbackUrl, retorno } = await searchParams;
  return (
    <main className="flex min-h-screen">
      {/* Painel esquerdo */}
      <div className="hidden bg-primary p-12 lg:flex lg:w-1/2">
        <div className="flex w-full flex-col items-center justify-center">
          {/* Logo */}
          <div className="mb-20 flex items-center gap-3 self-start text-primary-foreground">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
              <Activity className="size-5" />
            </div>

            <span className="text-lg font-medium">Template</span>
          </div>

          {/* Conteúdo */}
          <div className="max-w-md text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-medium leading-snug tracking-tight">
              Infraestrutura pronta para começar
            </h2>

            <p className="text-sm leading-relaxed text-primary-foreground/65">
              Autenticação e controle de acesso já configurados num só lugar.
            </p>
          </div>

          {/* Cards */}
          <div className="mt-16 grid w-full max-w-sm grid-cols-2 gap-3">
            {[
              { value: "100%", label: "Dados seguros" },
              { value: "24/7", label: "Disponível" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-primary-foreground/12 bg-primary-foreground/8 p-4"
              >
                <p className="text-2xl font-medium tracking-tight text-primary-foreground">
                  {s.value}
                </p>

                <p className="mt-0.5 text-xs text-primary-foreground/55">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex w-full items-center justify-center p-10 lg:w-1/2">
        <LoginForm retorno={callbackUrl ?? retorno} />
      </div>
    </main>
  );
}
