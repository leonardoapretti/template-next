// packages/design-system/components/multi-step-form/multi-step-form.tsx

"use client";

import React, { useEffect, useMemo } from "react";
import type { FieldValues } from "react-hook-form";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { AnimatedStep } from "./animated-step";

import {
  MultiStepFormFooter,
  MultiStepFormMainContentHeader,
  MultiStepFormNavigationHeader,
  MultiStepFormStep,
} from "./components";

import { MultiStepFormContext } from "./context";

import { Navigation } from "./navigation";

import type { MultiStepFormProps } from "./types";

import { useMultiStepForm } from "./use-multi-step-form";

import { formatStepName } from "./utils";

export function MultiStepForm<T extends FieldValues>({
  schema,
  form,
  onSubmit,
  children,
  className,
  storageKey,
  steps: externalSteps,
  orientation = "horizontal",
}: React.PropsWithChildren<MultiStepFormProps<T>>) {
  const isMobile = useIsMobile();

  const steps = useMemo(
    () =>
      React.Children.toArray(children).filter(
        (child): child is React.ReactElement<{ name: string }> =>
          React.isValidElement(child) && child.type === MultiStepFormStep,
      ),
    [children],
  );

  const footer = useMemo(
    () =>
      React.Children.toArray(children).find(
        (child) => React.isValidElement(child) && child.type === MultiStepFormFooter,
      ),
    [children],
  );

  const mainContentHeader = useMemo(
    () =>
      React.Children.toArray(children).find(
        (child) => React.isValidElement(child) && child.type === MultiStepFormMainContentHeader,
      ),
    [children],
  );

  const navigationHeader = useMemo(
    () =>
      React.Children.toArray(children).find(
        (child) => React.isValidElement(child) && child.type === MultiStepFormNavigationHeader,
      ),
    [children],
  );

  const stepNames = steps.map((step) => step.props.name);

  const multiStepForm = useMultiStepForm(schema, form, stepNames, storageKey);

  const { formState } = form;
  const { clearStorage } = multiStepForm;

  useEffect(() => {
    if (formState.isSubmitSuccessful) {
      clearStorage();
    }
  }, [formState.isSubmitSuccessful, clearStorage]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") return;

    const target = event.target as HTMLElement;

    if (
      target.tagName === "TEXTAREA" ||
      target.tagName === "BUTTON" ||
      (target.tagName === "INPUT" && target.getAttribute("type") === "button")
    ) {
      return;
    }

    event.preventDefault();

    if (multiStepForm.isLastStep) {
      form.handleSubmit(onSubmit)();
      return;
    }

    multiStepForm.nextStep(event);
  };

  const schemaSteps = useMemo(() => {
    if (externalSteps && externalSteps.length > 0) {
      return externalSteps.map((stepConfig, index) => ({
        name: stepConfig.id,
        label: stepConfig.title,
        description: stepConfig.description,
        index,
      }));
    }

    return stepNames.map((name, index) => ({
      name,
      label: `${index + 1}. ${formatStepName(name)}`,
      description: undefined,
      index,
    }));
  }, [stepNames, externalSteps]);

  // Layout vertical: no mobile colapsa para full-width empilhado
  if (orientation === "vertical") {
    return (
      <MultiStepFormContext.Provider value={multiStepForm}>
        <div
          className={cn(
            "col-span-full grid h-full",
            isMobile ? "grid-cols-1" : "grid-cols-3",
            className,
          )}
        >
          {/* Painel de navegação lateral — ocupa linha própria no mobile */}
          <div
            className={cn(
              "flex flex-col border-border/80 bg-muted/30",
              isMobile
                ? "col-span-1 rounded-t-3xl border-b p-4 pb-0"
                : "col-span-1 rounded-l-3xl border-r p-8",
            )}
          >
            {navigationHeader && (
              <div className={cn(isMobile ? "mb-4" : "mb-8")}>{navigationHeader}</div>
            )}

            <div className={cn("flex-1", isMobile ? "" : "p-2")}>
              <Navigation
                currentStepIndex={multiStepForm.currentStepIndex}
                goToStep={multiStepForm.goToStep}
                highestCompletedStep={multiStepForm.highestCompletedStep}
                orientation={orientation}
                schemaSteps={schemaSteps}
              />
            </div>
          </div>

          {/* Conteúdo principal */}
          <div
            className={cn(
              "flex flex-col",
              isMobile
                ? "col-span-1 space-y-6 bg-card/90 p-4"
                : "col-span-2 space-y-12 bg-card/90 p-10 pb-0 lg:p-14",
            )}
          >
            {mainContentHeader && <div>{mainContentHeader}</div>}

            <form
              className="flex flex-1 flex-col justify-between"
              onKeyDown={handleKeyDown}
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <main className="relative flex-1 transition-transform duration-500">
                {steps.map((step, index) => {
                  const isActive = index === multiStepForm.currentStepIndex;

                  return (
                    <AnimatedStep
                      currentIndex={multiStepForm.currentStepIndex}
                      direction={multiStepForm.direction}
                      index={index}
                      isActive={isActive}
                      key={step.props.name}
                    >
                      {step}
                    </AnimatedStep>
                  );
                })}
              </main>

              {footer}
            </form>
          </div>
        </div>
      </MultiStepFormContext.Provider>
    );
  }

  // Layout horizontal (padrão)
  return (
    <MultiStepFormContext.Provider value={multiStepForm}>
      <form
        className={cn(
          "flex size-full flex-col overflow-hidden rounded-3xl border bg-card/90 p-4 shadow-sm backdrop-blur sm:p-6",
          className,
        )}
        onKeyDown={handleKeyDown}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <aside className="mb-6 flex w-full flex-col justify-center">
          {navigationHeader && <div className="mb-6">{navigationHeader}</div>}

          <Navigation
            currentStepIndex={multiStepForm.currentStepIndex}
            goToStep={multiStepForm.goToStep}
            highestCompletedStep={multiStepForm.highestCompletedStep}
            orientation={orientation}
            schemaSteps={schemaSteps}
          />
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          {mainContentHeader && <div className="mb-6">{mainContentHeader}</div>}

          <main className="relative flex-1 transition-transform duration-500">
            {steps.map((step, index) => {
              const isActive = index === multiStepForm.currentStepIndex;

              return (
                <AnimatedStep
                  currentIndex={multiStepForm.currentStepIndex}
                  direction={multiStepForm.direction}
                  index={index}
                  isActive={isActive}
                  key={step.props.name}
                >
                  {step}
                </AnimatedStep>
              );
            })}
          </main>

          {footer}
        </div>
      </form>
    </MultiStepFormContext.Provider>
  );
}
