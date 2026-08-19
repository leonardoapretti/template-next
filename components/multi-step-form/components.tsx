// packages/design-system/components/multi-step-form/components.tsx

import { ChevronLeft, ChevronRight, RotateCcw, SaveIcon } from "lucide-react";
import React, { type HTMLProps } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "../ui/button";
import { useMultiStepFormContext } from "./context";
import type { MultiStepFormFooterProps } from "./types";

export const MultiStepFormStep = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    name: string;
  }
>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

MultiStepFormStep.displayName = "MultiStepFormStep";

export const MultiStepFormMainContentHeader = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<HTMLProps<HTMLDivElement>>
>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

MultiStepFormMainContentHeader.displayName = "MultiStepFormMainContentHeader";

export const MultiStepFormNavigationHeader = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<HTMLProps<HTMLDivElement>>
>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

MultiStepFormNavigationHeader.displayName = "MultiStepFormNavigationHeader";

export const MultiStepFormHeader = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<HTMLProps<HTMLDivElement>>
>(({ children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

MultiStepFormHeader.displayName = "MultiStepFormHeader";

// ─────────────────────────────────────────────
// Peças internas reutilizadas pelos dois layouts
// ─────────────────────────────────────────────

type FooterContext = ReturnType<typeof useMultiStepFormContext>;

function SavedIndicator() {
  return (
    <div className="flex items-center text-muted-foreground">
      <SaveIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
      <p className="text-xs">Alterações salvas neste dispositivo</p>
    </div>
  );
}

type SubmitOrNextButtonProps = {
  isLastStep: boolean;
  isSubmitting: boolean;
  nextStep: FooterContext["nextStep"];
  nextLabel: string;
  submitLabel: string;
  submittingLabel: string;
  className?: string;
  disabled?: boolean;
};

function SubmitOrNextButton({
  isLastStep,
  isSubmitting,
  nextStep,
  nextLabel,
  submitLabel,
  submittingLabel,
  className,
  disabled,
}: SubmitOrNextButtonProps) {
  const label = isLastStep ? (isSubmitting ? submittingLabel : submitLabel) : nextLabel;

  return (
    <Button
      disabled={isSubmitting || disabled}
      onClick={isLastStep ? undefined : nextStep}
      type={isLastStep ? "submit" : "button"}
      className={className}
    >
      {label}
      {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
    </Button>
  );
}

// ─────────────────────────────────────────────
// Props compartilhadas pelos dois layouts
// ─────────────────────────────────────────────

type FooterLayoutProps = FooterContext &
  Required<
    Pick<
      MultiStepFormFooterProps,
      | "nextLabel"
      | "previousLabel"
      | "submitLabel"
      | "submittingLabel"
      | "resetLabel"
      | "showResetButton"
    >
  > &
  Pick<
    MultiStepFormFooterProps,
    "disabled" | "onSecondarySubmit" | "secondarySubmitLabel" | "secondarySubmittingLabel"
  > & {
    children?: React.ReactNode;
  };

// ─────────────────────────────────────────────
// Layout mobile
// ─────────────────────────────────────────────

function MobileFooterLayout({
  children,
  disabled,
  hasSavedData,
  isFirstStep,
  isLastStep,
  isSubmitting,
  prevStep,
  nextStep,
  resetForm,
  nextLabel,
  previousLabel,
  submitLabel,
  submittingLabel,
  secondarySubmitLabel,
  secondarySubmittingLabel,
  onSecondarySubmit,
  resetLabel,
  showResetButton,
}: FooterLayoutProps) {
  const shouldShowSecondarySubmit = isLastStep && onSecondarySubmit && secondarySubmitLabel;

  return (
    <>
      {(hasSavedData || children) && (
        <div className="flex flex-col gap-2 pt-4">
          {hasSavedData && <SavedIndicator />}
          {children}
        </div>
      )}

      <div className="flex flex-col gap-2 py-4">
        <SubmitOrNextButton
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
          nextStep={nextStep}
          nextLabel={nextLabel}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
          className="w-full"
          disabled={disabled}
        />

        {shouldShowSecondarySubmit && (
          <Button
            disabled={isSubmitting || disabled}
            onClick={onSecondarySubmit}
            type="button"
            variant="outline"
            className="w-full"
          >
            {isSubmitting ? secondarySubmittingLabel : secondarySubmitLabel}
          </Button>
        )}

        <Button
          disabled={isFirstStep || disabled}
          onClick={prevStep}
          type="button"
          variant="outline"
          className="w-full"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {previousLabel}
        </Button>

        {showResetButton && hasSavedData && (
          <Button onClick={resetForm} type="button" variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            {resetLabel}
          </Button>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Layout desktop
// ─────────────────────────────────────────────

function DesktopFooterLayout({
  children,
  disabled,
  hasSavedData,
  isFirstStep,
  isLastStep,
  isSubmitting,
  prevStep,
  nextStep,
  resetForm,
  nextLabel,
  previousLabel,
  submitLabel,
  submittingLabel,
  secondarySubmitLabel,
  secondarySubmittingLabel,
  onSecondarySubmit,
  resetLabel,
  showResetButton,
}: FooterLayoutProps) {
  const shouldShowSecondarySubmit = isLastStep && onSecondarySubmit && secondarySubmitLabel;

  return (
    <div className="flex w-full items-center justify-between py-8">
      <div className="flex items-center gap-4">
        {hasSavedData && <SavedIndicator />}
        {children}
      </div>

      <div className="flex gap-4">
        {showResetButton && hasSavedData && (
          <Button onClick={resetForm} type="button" variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            {resetLabel}
          </Button>
        )}

        <Button
          disabled={isFirstStep || disabled}
          onClick={prevStep}
          type="button"
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {previousLabel}
        </Button>

        <SubmitOrNextButton
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
          nextStep={nextStep}
          nextLabel={nextLabel}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
          disabled={disabled}
        />

        {shouldShowSecondarySubmit && (
          <Button
            disabled={isSubmitting || disabled}
            onClick={onSecondarySubmit}
            type="button"
            variant="outline"
          >
            {isSubmitting ? secondarySubmittingLabel : secondarySubmitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MultiStepFormFooter — só orquestra
// ─────────────────────────────────────────────

export const MultiStepFormFooter = React.forwardRef<HTMLDivElement, MultiStepFormFooterProps>(
  (
    {
      children,
      previousLabel = "Anterior",
      nextLabel = "Próxima",
      submitLabel = "Salvar",
      submittingLabel = "Salvando...",
      secondarySubmitLabel,
      secondarySubmittingLabel = "Salvando...",
      onSecondarySubmit,
      disabled,
      resetLabel = "Reiniciar",
      showResetButton = true,
      className,
      ...props
    },
    ref,
  ) => {
    const ctx = useMultiStepFormContext();
    const isMobile = useIsMobile();

    const layoutProps: FooterLayoutProps = {
      ...ctx,
      nextLabel,
      previousLabel,
      submitLabel,
      submittingLabel,
      secondarySubmitLabel,
      secondarySubmittingLabel,
      onSecondarySubmit,
      disabled,
      resetLabel,
      showResetButton,
      children,
    };

    const Layout = isMobile ? MobileFooterLayout : DesktopFooterLayout;

    return (
      <div ref={ref} className={className} {...props}>
        <Layout {...layoutProps} />
      </div>
    );
  },
);

MultiStepFormFooter.displayName = "MultiStepFormFooter";
