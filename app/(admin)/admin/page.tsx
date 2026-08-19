import { FileTextIcon, MailIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import {
  PageCardLink,
  PageGrid,
  PageHeader,
  PageShell,
  StatCard,
} from "@/components/pages/page-shell";

export default function AdminPage() {
  return (
    <PageShell>
      <PageHeader
        icon={<ShieldCheckIcon className="size-5" />}
        title="Área protegida"
        description="Esta página só é visível para usuários administradores autenticados, protegida pelo motor de controle de acesso (RBAC) do template."
      />

      <PageGrid columns={3}>
        <StatCard icon={<UsersIcon className="size-5" />} label="Usuários" value="1" />
        <StatCard icon={<MailIcon className="size-5" />} label="E-mails enviados" value="—" />
        <StatCard icon={<FileTextIcon className="size-5" />} label="Documentos" value="—" />
      </PageGrid>

      <PageGrid columns={2}>
        <PageCardLink
          label="Exemplo"
          title="Envio de e-mails"
          description="Formulário de destinatário/assunto/corpo, protegido por RBAC."
          href="/admin/emails"
        />
      </PageGrid>
    </PageShell>
  );
}
