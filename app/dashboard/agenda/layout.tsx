import { AgendaProvider } from "@/components/sidebar/sidebar-agenda/agenda-context";

export default function AgendaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AgendaProvider>{children}</AgendaProvider>;
}
