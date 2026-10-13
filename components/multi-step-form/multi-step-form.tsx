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
  allStepsUnlocked,
  initialStep,
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

  const multiStepForm = useMultiStepForm(
    schema,
    form,
    stepNames,
    storageKey,
    allStepsUnlocked,
    initialStep,
  );

  const { formState } = form;
  const { clearStorage } = multiStepForm;

  useEffect(() => {
    if (formState.isSubmitSuccessful) {
      clearStorage();
    }
  }, [formState.isSubmitSuccessful, clearStorage]);

  // `onSubmit` pode lançar de propósito pra sinalizar falha de negócio ao
  // react-hook-form (isSubmitSuccessful só vira false assim — ver
  // convenção em novo-cliente-form.tsx). O form já mostrou o erro (toast)
  // antes de lançar, então aqui só evita a rejeição não tratada.
  const submitForm = form.handleSubmit(onSubmit);
  const handleSubmit = (event?: React.SyntheticEvent) => {
    submitForm(event)?.catch(() => {});
  };

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
      handleSubmit();
      return;
    }

    void multiStepForm.nextStep(event);
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
            "col-span-full grid h-full overflow-hidden rounded-lg border",
            isMobile ? "grid-cols-1" : "grid-cols-3",
            className,
          )}
        >
          {/* Painel de navegação lateral — ocupa linha própria no mobile; no
              desktop fica fixo perto do topo enquanto só o formulário rola.
              Não usa o truque `top-1/2 -translate-y-1/2` (centralizar
              verticalmente dentro da grid row) porque o % de `top` num
              elemento sticky resolve contra o container de scroll, não
              contra a altura da própria row — numa etapa com pouco
              conteúdo (row baixa) isso empurra a navegação pra fora do
              card, por cima ou por baixo, dependendo da altura da página.
              `top-8` é previsível em qualquer altura de conteúdo. */}
          <div
            className={cn(
              "flex flex-col bg-muted/30",
              isMobile
                ? "col-span-1 border-b p-4 pb-0"
                : "sticky top-8 col-span-1 max-h-screen self-start overflow-y-auto border-r p-6",
            )}
          >
            {navigationHeader && (
              <div className={cn(isMobile ? "mb-4" : "mb-6")}>{navigationHeader}</div>
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
                ? "col-span-1 space-y-6 bg-card p-4"
                : "col-span-2 space-y-8 bg-card p-6 pb-0 lg:p-8",
            )}
          >
            {mainContentHeader && <div>{mainContentHeader}</div>}

            <form
              className="flex flex-1 flex-col justify-between"
              onKeyDown={handleKeyDown}
              onSubmit={handleSubmit}
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
        className={cn("flex size-full flex-col rounded-lg border bg-card p-4 sm:p-6", className)}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
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

        <div className="flex flex-1 flex-col overflow-x-hidden">
          {mainContentHeader && <div className="mb-6">{mainContentHeader}</div>}

          {/* px-1: dá espaço pro ring de foco/erro dos inputs da etapa ativa
              não ser cortado por este overflow-x-hidden — ele existe pra
              esconder as etapas inativas deslizando fora da tela (ver
              AnimatedStep), não pra decoração, então não pode ser removido. */}
          <main className="relative flex-1 px-1 transition-transform duration-500">
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
