import { redirect } from "next/navigation";
import { canActAs, getAccessContext } from "@/lib/access-control";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function EmailsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!canActAs(ctx, "ADMIN")) {
    redirect("/dashboard?acessoNegado=admin");
  }

  return children;
}
