// packages/design-system/components/multi-step-form/types.ts

import type { HTMLProps } from "react";

import type { FieldValues, UseFormReturn } from "react-hook-form";

import type { z } from "zod";

export interface StepDefinition {
  id: string;
  step: number;
  title: string;
  description?: string;
}

export interface MultiStepFormProps<T extends FieldValues> {
  schema: z.ZodType<T>;

  form: UseFormReturn<T>;

  onSubmit: (data: T) => void;

  className?: string;

  storageKey?: string;

  // Modo edição: os dados já existem, então todas as etapas começam liberadas
  // na navegação (sem precisar avançar uma a uma).
  allStepsUnlocked?: boolean;

  // Etapa (pelo `name`) em que o formulário abre — ex.: link direto pra etapa
  // de fotos. Vale mais que a etapa de um rascunho salvo; nome desconhecido
  // é ignorado.
  initialStep?: string;

  steps?: StepDefinition[];

  orientation?: "horizontal" | "vertical";
}

export interface MultiStepFormFooterProps
  extends React.PropsWithChildren<HTMLProps<HTMLDivElement>> {
  previousLabel?: string;

  nextLabel?: string;

  submitLabel?: string;

  submittingLabel?: string;

  secondarySubmitLabel?: string;

  secondarySubmittingLabel?: string;

  onSecondarySubmit?: () => void;

  disabled?: boolean;

  resetLabel?: string;

  showResetButton?: boolean;
}
