import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { docs } from "@/.source/server";

export function createDocsSource(baseUrl: string) {
  return loader({
    baseUrl,
    source: docs.toFumadocsSource(),
    plugins: [lucideIconsPlugin()],
  });
}

// Documentação pública (/docs).
export const source = createDocsSource("/docs");

// Mesmo conteúdo, servido dentro do dashboard autenticado, restrito a admins (/dashboard/docs).
export const adminSource = createDocsSource("/dashboard/docs");
