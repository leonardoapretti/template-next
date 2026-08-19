import { KeyRound, MailIcon, UserCircleIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { AlterarEmailForm } from "./_components/alterar-email-form";
import { AlterarSenhaCard } from "./_components/alterar-senha-card";

export const metadata: Metadata = {
  title: "Configurações da conta | Template",
};

export default async function ContaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <PageShell>
      <PageHeader
        icon={<UserCircleIcon className="size-5" />}
        title="Configurações da conta"
        description={`Logado como ${session.user.email}`}
      />

      <PageSection title="Alterar senha" icon={<KeyRound className="size-4" />}>
        <AlterarSenhaCard />
      </PageSection>

      <PageSection title="Alterar e-mail" icon={<MailIcon className="size-4" />}>
        <AlterarEmailForm />
      </PageSection>
    </PageShell>
  );
}
