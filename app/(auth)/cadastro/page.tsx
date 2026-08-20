import { Activity } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { CadastroForm } from "./_components/cadastro-form";

export const metadata: Metadata = { title: "Cadastre-se | Template" };

export default async function CadastroPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard?jaLogado=1");
  }
  await connection();

  return (
    <main className="flex min-h-screen">
      <div className="hidden bg-primary p-12 lg:flex lg:w-1/2">
        <div className="flex w-full flex-col items-center justify-center">
          <div className="mb-20 flex items-center gap-3 self-start text-primary-foreground">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
              <Activity className="size-5" />
            </div>
            <span className="text-lg font-medium">Template</span>
          </div>
          <div className="max-w-md text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-medium leading-snug tracking-tight">
              Sua base para começar rápido
            </h2>
            <p className="text-sm leading-relaxed text-primary-foreground/65">
              Cadastre-se para explorar autenticação e controle de acesso já prontos.
            </p>
          </div>
        </div>
      </div>
      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2">
        <CadastroForm />
      </div>
    </main>
  );
}
