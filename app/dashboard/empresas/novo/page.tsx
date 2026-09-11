import { Building2Icon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { CriarEmpresaForm } from "./_components/criar-empresa-form";

export const metadata: Metadata = {
  title: "Criar empresa | Template",
};

export default function NovaEmpresaPage() {
  return (
    <PageShell>
      <PageHeader
        description="Você se torna o Proprietário da empresa criada, com acesso a todas as ações administrativas dela."
        icon={<Building2Icon className="size-5" />}
        title="Criar empresa"
      />

      <PageSection title="Dados da empresa">
        <CriarEmpresaForm />
      </PageSection>
    </PageShell>
  );
}
