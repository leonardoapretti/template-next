// packages/design-system/components/multi-step-form/navigation.tsx

"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface StepConfig {
  name: string;
  label: string;
  description?: string;
  index: number;
}

interface NavigationProps {
  schemaSteps: StepConfig[];
  orientation: "horizontal" | "vertical";
  currentStepIndex: number;
  highestCompletedStep: number;
  goToStep: (index: number, skipValidation?: boolean) => void;
}

export function Navigation({
  schemaSteps,
  orientation,
  currentStepIndex,
  highestCompletedStep,
  goToStep,
}: NavigationProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isMobile) {
    const currentStep = schemaSteps[currentStepIndex];
    const total = schemaSteps.length;

    return (
      <div className="w-full">
        {/* Header: etapa atual + contador + seta. Toda a área é clicável. */}
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-1 py-2 transition-colors hover:bg-muted/50"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          <div className="text-left">
            <p className="text-sm font-medium text-primary leading-none">{currentStep?.label}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-none">
              Etapa {currentStepIndex + 1} de {total}
            </p>
          </div>

          <ChevronDown
            className={cn(
              "text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200",
              { "rotate-180": isExpanded },
            )}
          />
        </button>

        {/* Painel expandido com a navegação completa */}
        {isExpanded && (
          <div className="border-border mt-1 flex flex-col gap-0.5 rounded-md border bg-popover p-2 shadow-md">
            {schemaSteps.map((step) => {
              const isActive = step.index === currentStepIndex;
              const isCompleted = step.index < currentStepIndex;
              const isDisabled = step.index > highestCompletedStep;

              return (
                <button
                  key={step.index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    goToStep(step.index, step.index < currentStepIndex);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-colors",
                    "disabled:pointer-events-none disabled:opacity-40",
                    {
                      "bg-primary/10": isActive,
                      "hover:bg-muted/60": !isActive,
                    },
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      {
                        "border-primary bg-primary text-primary-foreground": isActive,
                        "border-primary bg-primary/10 text-primary": isCompleted,
                        "border-border bg-background text-muted-foreground":
                          !isActive && !isCompleted,
                      },
                    )}
                  >
                    {step.index + 1}
                  </div>

                  <div>
                    <p
                      className={cn("text-sm font-medium leading-none", {
                        "text-primary": isActive || isCompleted,
                        "text-muted-foreground": !isActive && !isCompleted,
                      })}
                    >
                      {step.label}
                    </p>

                    {step.description && (
                      <p className="text-muted-foreground mt-0.5 text-xs">{step.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Desktop / vertical — sem alterações
  return (
    <div
      className={cn("flex", {
        "items-center gap-2": orientation === "horizontal",
        "w-full flex-1 flex-col": orientation === "vertical",
      })}
    >
      {schemaSteps.map((step) => {
        const isActive = step.index === currentStepIndex;
        const isCompleted = step.index < currentStepIndex;
        const isDisabled = step.index > highestCompletedStep;

        return (
          <div
            key={step.index}
            className={cn("relative flex", {
              "flex-1 flex-col items-center": orientation === "horizontal",
              "w-full items-start": orientation === "vertical",
            })}
          >
            <button
              className={cn(
                "transition-colors",
                "disabled:pointer-events-none disabled:opacity-50",
                {
                  "flex w-full cursor-pointer flex-col items-center gap-2 rounded hover:bg-muted/50":
                    orientation === "horizontal",
                  "flex w-full items-start rounded pb-8 text-left last:pb-0":
                    orientation === "vertical",
                },
              )}
              disabled={isDisabled}
              onClick={() => goToStep(step.index, step.index < currentStepIndex)}
              type="button"
            >
              {orientation === "vertical" && (
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium",
                    {
                      "border-primary bg-primary text-primary-foreground": isActive,
                      "border-primary bg-primary/10 text-primary": isCompleted,
                      "border-border bg-background text-muted-foreground":
                        !isActive && !isCompleted,
                    },
                  )}
                >
                  {step.index + 1}
                </div>
              )}

              <div
                className={cn({
                  "space-y-0.5 text-center": orientation === "horizontal",
                  "mt-0.5 px-2 text-left": orientation === "vertical",
                })}
              >
                <p
                  className={cn("text-sm font-medium", {
                    "text-primary": isActive || isCompleted,
                    "text-muted-foreground": !isActive && !isCompleted,
                  })}
                >
                  {step.label}
                </p>

                {step.description && (
                  <p className="text-muted-foreground text-xs">{step.description}</p>
                )}
              </div>

              {orientation === "horizontal" && (
                <div
                  className={cn("h-1 w-full rounded-full", {
                    "bg-primary": isActive || isCompleted,
                    "bg-border": !isActive && !isCompleted,
                  })}
                />
              )}
            </button>

            {orientation === "vertical" && step.index < schemaSteps.length - 1 && (
              <div className="bg-border absolute top-8 left-3 h-[calc(100%-1rem)] w-px" />
            )}
          </div>
        );
      })}
    </div>
  );
}
