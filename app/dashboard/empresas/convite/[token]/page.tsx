import { MailIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { auth } from "@/auth";
import { empresaService } from "@/lib/services/empresa.service";
import { userService } from "@/lib/services/user.service";
import { AceitarConviteButton } from "./_components/aceitar-convite-button";
import { IrParaAutenticacaoButton } from "./_components/ir-para-autenticacao-button";

export const metadata: Metadata = {
  title: "Convite | Template",
};

export default async function ConviteEmpresaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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

  const session = await auth().catch(() => null);
  const emailSessao = session?.user?.email?.trim().toLowerCase();
  const emailBate = emailSessao === convite.email.toLowerCase();

  return (
    <PageShell>
      <PageHeader
        description={`Perfil: ${convite.roleNome}`}
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
          <ConviteRequerOutraConta
            conviteEmail={convite.email}
            emailSessao={session?.user?.email}
            token={token}
          />
        )}
      </PageSection>
    </PageShell>
  );
}

// Quem clicou no link não está logado com o e-mail convidado (ou não está
// logado) — decide entre login/cadastro conforme o e-mail convidado já ter
// conta ou não, em vez de sempre mandar pra /login (que é um beco sem
// saída pra quem nunca teve conta).
async function ConviteRequerOutraConta({
  conviteEmail,
  emailSessao,
  token,
}: {
  conviteEmail: string;
  emailSessao?: string | null;
  token: string;
}) {
  const contaResponse = await userService.recuperarPorEmail(conviteEmail);
  const contaExiste = contaResponse.isSuccess() && contaResponse.data !== null;

  const urlConvite = `/dashboard/empresas/convite/${token}`;
  const destino = contaExiste
    ? `/login?retorno=${encodeURIComponent(urlConvite)}&email=${encodeURIComponent(conviteEmail)}`
    : // convite=token: permite ao cadastro pular a confirmação de e-mail —
      // cadastrarAction revalida o token no servidor e confere que o e-mail
      // do formulário bate com o do convite antes de dispensar a
      // confirmação, nunca confia só nesse parâmetro de URL.
      `/cadastro?retorno=${encodeURIComponent(urlConvite)}&email=${encodeURIComponent(conviteEmail)}&convite=${encodeURIComponent(token)}`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Este convite foi enviado para <strong>{conviteEmail}</strong>
        {emailSessao ? (
          <>
            , e você está logado como <strong>{emailSessao}</strong>
          </>
        ) : null}
        .{" "}
        {contaExiste
          ? "Essa conta já existe — entre com ela para aceitar."
          : "Essa conta ainda não existe — cadastre-se com esse e-mail para aceitar."}
      </p>

      <IrParaAutenticacaoButton destino={destino} precisaSairPrimeiro={Boolean(emailSessao)}>
        {contaExiste ? "Entrar com esse e-mail" : "Criar conta com esse e-mail"}
      </IrParaAutenticacaoButton>
    </div>
  );
}
