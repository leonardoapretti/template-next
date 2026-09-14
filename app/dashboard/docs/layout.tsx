import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { canActAs, getAccessContext } from "@/lib/access-control";
import { adminSource } from "@/lib/fumadocs/source";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function AdminDocsLayout({ children }: { children: ReactNode }) {
  const ctx = await getAccessContext().catch(() => redirect("/login"));

  if (!canActAs(ctx, "ADMIN")) {
    redirect("/dashboard?acessoNegado=admin");
  }

  return (
    <div className="w-full">
      <RootProvider search={{ enabled: false }}>
        <DocsLayout
          tree={adminSource.pageTree}
          nav={{
            title: "Documentação",
          }}
          sidebar={{
            collapsible: false,
          }}
        >
          {children}
        </DocsLayout>
      </RootProvider>
    </div>
  );
}
