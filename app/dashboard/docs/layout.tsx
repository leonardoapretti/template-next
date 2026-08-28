import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { canActAs, getAccessContext } from "@/lib/access-control";
import { adminSource } from "@/lib/fumadocs/source";

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
