import { MailIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { auth } from "@/auth";
import { empresaService } from "@/lib/services/empresa.service";
import { AceitarConviteButton } from "./_components/aceitar-convite-button";

export const metadata: Metadata = {
  title: "Convite | Template",
};

export default async function ConviteEmpresaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth().catch(() => null);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const response = await empresaService.buscarConvitePorToken(token);

  if (response.isError()) {
    return (
      <PageShell>
        <PageHeader icon={<MailIcon className="size-5" />} title="Convite inválido" />
        <PageSection>
          <p className="text-sm text-muted-foreground">
            Este convite não existe, já foi usado ou expirou. Peça para quem convidou enviar um
            novo.
          </p>
        </PageSection>
      </PageShell>
    );
  }

  const convite = response.data;
  const emailBate = convite.email.toLowerCase() === session.user.email.trim().toLowerCase();

  return (
    <PageShell>
      <PageHeader
        description={`Papel: ${convite.roleNome}`}
        icon={<MailIcon className="size-5" />}
        title={`Convite para ${convite.empresaNome}`}
      />

      <PageSection>
        {emailBate ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Você foi convidado para fazer parte de <strong>{convite.empresaNome}</strong> como{" "}
              {convite.roleNome}.
            </p>
            <AceitarConviteButton token={token} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este convite foi enviado para <strong>{convite.email}</strong>, e você está logado
            como <strong>{session.user.email}</strong>. Faça login com o e-mail convidado para
            aceitar.
          </p>
        )}
      </PageSection>
    </PageShell>
  );
}
