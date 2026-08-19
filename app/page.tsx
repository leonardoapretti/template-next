import { Activity, ArrowRight, BookOpen, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserNavIndicator } from "@/components/user-nav-indicator";

export const metadata: Metadata = {
  title: "Template Next.js",
  description:
    "Template Next.js com autenticação, controle de acesso, criptografia, e-mail transacional e documentação já configurados.",
};

const recursos = [
  {
    icon: KeyRound,
    title: "Autenticação",
    description:
      "Login com credenciais via Auth.js (NextAuth), sessão JWT e cadastro com verificação de e-mail.",
  },
  {
    icon: ShieldCheck,
    title: "Controle de acesso",
    description: "Motor de RBAC com papéis e guards de ação.",
  },
  {
    icon: Lock,
    title: "Criptografia",
    description:
      "Criptografia e descriptografia de campos sensíveis via extensão do Prisma Client.",
  },
  {
    icon: Mail,
    title: "E-mail transacional",
    description: "Envio de e-mails via Resend, com template HTML reutilizável.",
  },
  {
    icon: BookOpen,
    title: "Documentação",
    description: "Documentação dos serviços do template servida via Fumadocs.",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-2 font-semibold" href="/">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <span className="truncate">Template</span>
          </Link>

          <nav className="flex items-center gap-2" aria-label="Acesso à conta">
            <ThemeToggle />
            {session?.user ? (
              <UserNavIndicator
                name={session.user.nome ?? session.user.email ?? "Usuário"}
                email={session.user.email ?? ""}
              />
            ) : (
              <>
                <Button
                  nativeButton={false}
                  render={<Link href="/login" />}
                  size="sm"
                  variant="ghost"
                >
                  Entrar
                </Button>
                <Button nativeButton={false} render={<Link href="/cadastro" />} size="sm">
                  Criar conta
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="border-b bg-[linear-gradient(135deg,var(--color-background),var(--color-muted)_62%,var(--color-primary)/12%)]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Template Next.js com infraestrutura pronta para produção.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Autenticação, controle de acesso, criptografia, e-mail transacional, logger, testes e
            documentação já configurados — pronto para ser estendido.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button nativeButton={false} render={<Link href="/cadastro" />} size="lg">
              Criar conta
              <ArrowRight className="size-4" />
            </Button>
            <Button nativeButton={false} render={<Link href="/docs" />} size="lg" variant="outline">
              Ver documentação
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">Serviços disponíveis</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recursos.map(({ icon: Icon, title, description }) => (
            <article className="rounded-2xl border bg-card p-5 shadow-sm" key={title}>
              <Icon className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/35">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Páginas de exemplo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fluxos mínimos prontos para servir de referência.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              className="rounded-2xl border bg-card p-5 shadow-sm hover:bg-muted/40"
              href="/cadastro"
            >
              <h3 className="font-semibold">Cadastro e login</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Formulário de cadastro e autenticação, seguindo o padrão form/schema/actions.
              </p>
            </Link>
            <Link
              className="rounded-2xl border bg-card p-5 shadow-sm hover:bg-muted/40"
              href="/dashboard"
            >
              <h3 className="font-semibold">Rota protegida (login)</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Área acessível para qualquer usuário autenticado.
              </p>
            </Link>
            <Link
              className="rounded-2xl border bg-card p-5 shadow-sm hover:bg-muted/40"
              href="/admin"
            >
              <h3 className="font-semibold">Rota protegida (RBAC)</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Área acessível apenas por usuários com papel de administrador.
              </p>
            </Link>
            <Link
              className="rounded-2xl border bg-card p-5 shadow-sm hover:bg-muted/40"
              href="/fale-conosco"
            >
              <h3 className="font-semibold">Envio de e-mail (público)</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Formulário de contato que envia e-mail transacional via Resend.
              </p>
            </Link>
            <Link
              className="rounded-2xl border bg-card p-5 shadow-sm hover:bg-muted/40"
              href="/admin/emails"
            >
              <h3 className="font-semibold">Envio de e-mail (admin)</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Formulário livre de assunto/corpo, protegido por RBAC.
              </p>
            </Link>
            <Link
              className="rounded-2xl border bg-card p-5 shadow-sm hover:bg-muted/40"
              href="/docs"
            >
              <h3 className="font-semibold">Documentação (pública)</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Documentação dos serviços de infraestrutura do template, acessível sem login.
              </p>
            </Link>
            <Link
              className="rounded-2xl border bg-card p-5 shadow-sm hover:bg-muted/40"
              href="/admin/docs"
            >
              <h3 className="font-semibold">Documentação (protegida)</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Mesmo conteúdo, servido dentro da área administrativa autenticada.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Template Next.js.</p>
          <Link className="hover:text-foreground" href="/fale-conosco">
            Fale conosco
          </Link>
        </div>
      </footer>
    </main>
  );
}
