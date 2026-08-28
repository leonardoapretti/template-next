import { redirect } from "next/navigation";
import { canActAs, getAccessContext } from "@/lib/access-control";

export default async function EmailsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!canActAs(ctx, "ADMIN")) {
    redirect("/dashboard?acessoNegado=admin");
  }

  return children;
}
