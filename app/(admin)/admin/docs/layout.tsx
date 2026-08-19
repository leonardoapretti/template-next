import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { adminSource } from "@/lib/fumadocs/source";

export default function AdminDocsLayout({ children }: { children: ReactNode }) {
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
