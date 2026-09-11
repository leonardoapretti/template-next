import { redirect } from "next/navigation";
import { getAccessContext, temEmpresaAtiva } from "@/lib/access-control";

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
