import type { Metadata } from "next";
import { AgendaClient } from "./_components/agenda-client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Agenda | Template",
};

export default function AgendaPage() {
  return <AgendaClient />;
}
