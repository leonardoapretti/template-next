import { source } from "@/lib/fumadocs/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";

export default function PublicDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      <RootProvider search={{ enabled: false }}>
        <DocsLayout
          tree={source.pageTree}
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
