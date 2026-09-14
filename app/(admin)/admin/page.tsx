import { ShieldCheckIcon } from "lucide-react";
import { PageHeader, PageShell } from "@/components/pages/page-shell";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
