import type { Metadata } from "next";
import { AgendaClient } from "./_components/agenda-client";

export const metadata: Metadata = {
  title: "Agenda | Template",
};

export default function AgendaPage() {
  return <AgendaClient />;
}
