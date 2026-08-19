"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWA_DISMISSED_KEY_PREFIX = "pwa-install-dismissed";

function getDismissedStorageKey(appName: string) {
  return `${PWA_DISMISSED_KEY_PREFIX}:${appName}`;
}

export function usePwaInstall(appName: string) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const dismissedStorageKey = getDismissedStorageKey(appName);

    if (window.matchMedia?.("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    setIsDismissed(Boolean(localStorage.getItem(dismissedStorageKey)));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [appName]);

  async function install() {
    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();

    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      setPromptEvent(null);
    }
  }

  function dismiss() {
    localStorage.setItem(getDismissedStorageKey(appName), "1");
    setIsDismissed(true);
  }

  return {
    canInstall: Boolean(promptEvent) && !isInstalled,
    isInstalled,
    isDismissed,
    install,
    dismiss,
  };
}
