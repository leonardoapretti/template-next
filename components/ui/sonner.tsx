"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Clicar no corpo do toast executa a ação dele (ex.: "Ver carrinho"), como se
// tivesse clicado no botão de ação; o botão de fechar e os botões continuam
// com o comportamento próprio.
function executarAcaoAoClicar(evento: MouseEvent) {
  const alvo = evento.target;

  if (!(alvo instanceof Element) || alvo.closest("button")) return;

  const toast = alvo.closest<HTMLElement>("[data-sonner-toast]");

  if (!toast || toast.dataset.swiped === "true") return;

  toast.querySelector<HTMLButtonElement>("[data-button]:not([data-cancel])")?.click();
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  useEffect(() => {
    document.addEventListener("click", executarAcaoAoClicar);

    return () => document.removeEventListener("click", executarAcaoAoClicar);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        duration: 6000,
        classNames: {
          toast:
            "!grid !grid-cols-[auto_1fr] !items-start !gap-x-4 !gap-y-1 !rounded-md !border !border-l-4 !border-border !bg-popover !p-4 !text-popover-foreground !shadow-2xl has-[[data-button]]:cursor-pointer",
          icon: "!m-0 !size-10 !justify-center !rounded-md [&_svg]:!m-0 [&_svg]:!size-5",
          content: "!gap-1 !pr-8",
          title: "!text-base !leading-snug !font-semibold !text-foreground",
          description: "!text-sm !text-muted-foreground",
          default: "!border-l-foreground [&_[data-icon]]:!bg-muted",
          success:
            "!border-l-primary [&_[data-icon]]:!bg-primary [&_[data-icon]]:!text-primary-foreground",
          error:
            "!border-l-destructive [&_[data-icon]]:!bg-destructive/10 [&_[data-icon]]:!text-destructive-text",
          warning:
            "!border-l-warning [&_[data-icon]]:!bg-warning/15 [&_[data-icon]]:!text-warning-text",
          info: "!border-l-info [&_[data-icon]]:!bg-info/10 [&_[data-icon]]:!text-info-text",
          loading: "!border-l-foreground [&_[data-icon]]:!bg-muted",
          closeButton:
            "!top-3 !right-3 !left-auto !size-7 !transform-none !rounded-md !border-0 !bg-transparent !text-muted-foreground hover:!bg-muted hover:!text-foreground",
          actionButton:
            "!col-start-2 !m-0 !mt-3 !h-9 !justify-self-start !rounded-md !bg-primary !px-4 !text-sm !font-semibold !text-primary-foreground hover:!brightness-110",
          cancelButton:
            "!col-start-2 !m-0 !mt-3 !h-9 !justify-self-start !rounded-md !bg-muted !px-4 !text-sm !text-foreground",
        },
      }}
      mobileOffset={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)" }}
      {...props}
    />
  );
};

export { Toaster };
