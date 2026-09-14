import { redirect } from "next/navigation";
import { getAccessContext, temEmpresaAtiva } from "@/lib/access-control";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Gate da área de gerenciamento de empresa: exige vínculo ativo com
// alguma empresa (qualquer papel). Análogo a app/(admin)/admin/layout.tsx,
// mas escopado a empresa em vez de admin global da plataforma.
export default async function EmpresaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!temEmpresaAtiva(ctx)) {
    redirect("/dashboard?acessoNegado=empresa");
  }

  return children;
}
