import { MailIcon } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader, PageSection, PageShell } from "@/components/pages/page-shell";
import { EnviarEmailForm } from "./_components/enviar-email-form";

export const metadata: Metadata = {
  title: "Envio de e-mails | Template",
};

export default function EmailsPage() {
  return (
    <PageShell>
      <PageHeader
        icon={<MailIcon className="size-5" />}
        title="Envio de e-mails"
        description={
          <>
            Exemplo de envio de e-mail transacional via{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://resend.com"
              rel="noreferrer"
              target="_blank"
            >
              Resend
            </a>
            , usando o mesmo serviço (<code>emailService</code>) que alimenta o fluxo de{" "}
            <code>/fale-conosco</code> e os e-mails transacionais de autenticação.
          </>
        }
      />

      <PageSection title="Em desenvolvimento">
        <p className="text-sm text-muted-foreground">
          Se a variável <code>EMAIL_DESTINATARIO_DEV</code> estiver definida no <code>.env</code>,
          todo e-mail enviado pela aplicação (independente do destinatário informado no formulário
          abaixo) é redirecionado para esse endereço — evitando envios acidentais a e-mails reais
          durante o desenvolvimento local. Em produção esse redirecionamento não acontece: o e-mail
          é enviado para o destinatário real.
        </p>
      </PageSection>

      <PageSection title="Como integrar com o Resend">
        <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
          <li>
            Crie uma conta em{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://resend.com"
              rel="noreferrer"
              target="_blank"
            >
              resend.com
            </a>{" "}
            e gere uma API key.
          </li>
          <li>
            Defina <code>RESEND_API_KEY</code> no <code>.env</code> com essa chave.
          </li>
          <li>
            Defina <code>RESEND_FROM_EMAIL</code> com um remetente verificado no Resend (ex:{" "}
            <code>Sua Empresa &lt;contato@seudominio.com&gt;</code>). Sem domínio verificado, use o
            remetente de teste padrão do Resend.
          </li>
          <li>
            (Opcional, dev) Defina <code>EMAIL_DESTINATARIO_DEV</code> com seu próprio e-mail, para
            testar envios localmente sem risco de mandar e-mail para destinatários reais.
          </li>
          <li>
            Use <code>emailService.enviarEmail(...)</code> (
            <code>lib/services/email.service.ts</code>) em qualquer service ou server action — ele
            já cuida do remetente, do redirecionamento em dev e do template HTML padrão (
            <code>criarEmailHtml</code>).
          </li>
        </ol>
      </PageSection>

      <PageSection title="Enviar e-mail">
        <EnviarEmailForm />
      </PageSection>
    </PageShell>
  );
}
