import { ShieldCheckIcon } from "lucide-react";
import { PageHeader, PageShell } from "@/components/pages/page-shell";

export default function AdminPage() {
  return (
    <PageShell>
      <PageHeader
        icon={<ShieldCheckIcon className="size-5" />}
        title="Área admin"
        description="Esta é a área administrativa. As funcionalidades restritas a administradores ficam no dashboard, protegidas pelo motor de controle de acesso (RBAC) do template."
      />
    </PageShell>
  );
}
