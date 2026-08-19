//packages/design-system/components/multi-step-form/animated-step.tsx

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedStep({
  isActive,
  direction,
  children,
  index,
  currentIndex,
}: React.PropsWithChildren<{
  direction: "forward" | "backward" | undefined;
  isActive: boolean;
  index: number;
  currentIndex: number;
}>) {
  const [shouldRender, setShouldRender] = useState(isActive);
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && stepRef.current) {
      const focusableElement = stepRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusableElement?.focus();
    }
  }, [isActive]);

  if (!shouldRender) {
    return null;
  }

  const baseClasses =
    "top-0 left-0 w-full h-full transition-all duration-300 ease-in-out animate-in fade-in zoom-in-95";
  const visibilityClasses = isActive ? "opacity-100" : "opacity-0 absolute";
  const transformClasses = cn(
    "translate-x-0",
    !isActive && {
      "-translate-x-full": direction === "forward" || index < currentIndex,
      "translate-x-full": direction === "backward" || index > currentIndex,
    },
  );

  return (
    <div
      aria-hidden={!isActive}
      className={cn(baseClasses, visibilityClasses, transformClasses)}
      ref={stepRef}
    >
      {children}
    </div>
  );
}
