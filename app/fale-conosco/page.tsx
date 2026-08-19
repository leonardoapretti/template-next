import type { Metadata } from "next";
import Link from "next/link";
import { FaleConoscoForm } from "./fale-conosco-form";

export const metadata: Metadata = {
  title: "Fale Conosco | Template",
};

type PageProps = {
  searchParams: Promise<{
    retorno?: string;
  }>;
};

function getRetornoSeguro(retorno?: string) {
  return retorno?.startsWith("/") && !retorno.startsWith("//") ? retorno : "/";
}

export default async function FaleConoscoPage({ searchParams }: PageProps) {
  const { retorno } = await searchParams;
  const retornoSeguro = getRetornoSeguro(retorno);

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <section className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-3 border-b pb-6">
          <Link className="text-sm text-primary hover:underline" href={retornoSeguro}>
            Voltar
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Fale conosco</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Exemplo de formulário que envia e-mail transacional via Resend.
          </p>
        </header>

        <FaleConoscoForm />
      </section>
    </main>
  );
}
