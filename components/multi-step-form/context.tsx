// packages/design-system/components/multi-step-form/context.tsx

"use client";

import { createContext, useContext } from "react";

import type { FieldValues, UseFormReturn } from "react-hook-form";

export interface MultiStepFormContextValue {
  form: UseFormReturn<any>;

  currentStep: string;

  currentStepIndex: number;

  totalSteps: number;

  isFirstStep: boolean;

  isLastStep: boolean;

  nextStep: (e?: React.SyntheticEvent) => Promise<void>;

  prevStep: (e?: React.SyntheticEvent) => void;

  goToStep: (index: number, skipValidation?: boolean) => Promise<void>;

  direction?: "forward" | "backward";

  isValid: boolean;

  errors: FieldValues;

  isSubmitting: boolean;

  hasSavedData: boolean;

  clearStorage: () => void;

  highestCompletedStep: number;

  getErrorsForStep: (stepName: string) => Record<string, unknown>;

  resetForm: () => void;
}

export const MultiStepFormContext = createContext<MultiStepFormContextValue | null>(null);

export function useMultiStepFormContext() {
  const context = useContext(MultiStepFormContext);

  if (!context) {
    throw new Error("useMultiStepFormContext must be used within a MultiStepForm");
  }

  return context;
}

interface MultiStepFormContextProviderProps {
  children: (context: MultiStepFormContextValue) => React.ReactNode;
}

export function MultiStepFormContextProvider({ children }: MultiStepFormContextProviderProps) {
  const context = useMultiStepFormContext();

  return children(context);
}
