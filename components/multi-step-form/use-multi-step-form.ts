"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { toast } from "sonner";
import { z } from "zod";

export function useMultiStepForm<TFieldValues extends FieldValues>(
  schema: z.ZodType<TFieldValues>,
  form: UseFormReturn<TFieldValues>,
  stepNames: string[],
  storageKey?: string,
) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [highestCompletedStep, setHighestCompletedStep] = useState(0);

  const [direction, setDirection] = useState<"forward" | "backward" | undefined>();

  const [hasSavedData, setHasSavedData] = useState(false);

  const initialDefaultValues = useRef(structuredClone(form.getValues()));

  // Flag para suprimir o watch durante um reset intencional,
  // evitando que o form.reset() re-salve valores vazios no storage
  // antes do clearStorage ter chance de remover a chave.
  const isResettingRef = useRef(false);

  // -----------------------------
  // LOAD FROM STORAGE
  // -----------------------------
  useEffect(() => {
    if (!storageKey) return;

    const saved = localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      form.reset(parsed.values);
      setCurrentStepIndex(parsed.stepIndex ?? 0);
      setHighestCompletedStep(parsed.stepIndex ?? 0);
      setHasSavedData(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao recuperar formulário salvo");
    }
  }, [storageKey, form]);

  // -----------------------------
  // SAVE TO STORAGE
  // -----------------------------
  useEffect(() => {
    if (!storageKey) return;

    const subscription = form.watch(() => {
      // Ignora disparos causados pelo form.reset() durante um reset intencional
      if (isResettingRef.current) return;

      const values = form.getValues();

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          values,
          stepIndex: currentStepIndex,
        }),
      );

      setHasSavedData(true);
    });

    return () => subscription.unsubscribe();
  }, [form, currentStepIndex, storageKey]);

  // -----------------------------
  // CLEAR STORAGE
  // -----------------------------
  const clearStorage = useCallback(() => {
    if (!storageKey) return;

    localStorage.removeItem(storageKey);
    setHasSavedData(false);
  }, [storageKey]);

  // -----------------------------
  // FIELD MAPPING (FIXED)
  // -----------------------------
  const getFieldsForStep = useCallback(
    (stepName: string): Path<TFieldValues>[] => {
      if (!(schema instanceof z.ZodObject)) return [];

      const shape = schema.shape as Record<string, z.ZodType>;
      const stepSchema = shape[stepName];

      if (!stepSchema) {
        return [];
      }

      if (stepSchema instanceof z.ZodArray) {
        return [stepName as Path<TFieldValues>];
      }

      if (!(stepSchema instanceof z.ZodObject)) {
        return [];
      }

      const fields: string[] = [];

      Object.keys(stepSchema.shape).forEach((field) => {
        const value = stepSchema.shape[field];

        // nested object
        if (value instanceof z.ZodObject) {
          Object.keys(value.shape).forEach((sub) => {
            fields.push(`${stepName}.${field}.${sub}`);
          });
          return;
        }

        // arrays OR primitives
        fields.push(`${stepName}.${field}`);
      });

      return fields as Path<TFieldValues>[];
    },
    [schema],
  );

  // -----------------------------
  // ERROR EXTRACTION
  // -----------------------------
  const getErrorsForStep = useCallback(
    (stepName: string) => {
      const fields = getFieldsForStep(stepName);

      return fields.reduce(
        (acc, field) => {
          const error = field
            .split(".")
            .reduce<unknown>(
              (obj, key) =>
                obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined,
              form.formState.errors,
            );

          if (error) {
            acc[field] = error;
          }

          return acc;
        },
        {} as Record<string, unknown>,
      );
    },
    [getFieldsForStep, form.formState.errors],
  );

  // -----------------------------
  // NEXT STEP (FIXED VALIDATION)
  // -----------------------------
  const nextStep = useCallback(
    async (e?: React.SyntheticEvent) => {
      e?.preventDefault();

      const currentStepName = stepNames[currentStepIndex];

      const fieldsToValidate = getFieldsForStep(currentStepName);

      if (fieldsToValidate.length === 0) {
        console.warn("Step sem campos mapeados:", currentStepName);
        return;
      }

      const isValid = await form.trigger(fieldsToValidate);

      if (!isValid) return;

      if (currentStepIndex < stepNames.length - 1) {
        setDirection("forward");

        setCurrentStepIndex((prev) => {
          const nextIndex = prev + 1;

          setHighestCompletedStep((h) => Math.max(h, nextIndex));

          return nextIndex;
        });
      }
    },
    [form, stepNames, currentStepIndex, getFieldsForStep],
  );

  // -----------------------------
  // PREV STEP
  // -----------------------------
  const prevStep = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();

      if (currentStepIndex === 0) return;

      setDirection("backward");
      setCurrentStepIndex((prev) => prev - 1);
    },
    [currentStepIndex],
  );

  // -----------------------------
  // GO TO STEP (FIXED VALIDATION)
  // -----------------------------
  const goToStep = useCallback(
    async (index: number, skipValidation = false) => {
      if (index < 0 || index >= stepNames.length || index > highestCompletedStep) {
        return;
      }

      if (skipValidation) {
        setDirection(index > currentStepIndex ? "forward" : "backward");
        setCurrentStepIndex(index);
        return;
      }

      const currentStepName = stepNames[currentStepIndex];

      const fieldsToValidate = getFieldsForStep(currentStepName);

      if (fieldsToValidate.length === 0) {
        console.warn("Step sem campos mapeados:", currentStepName);
        return;
      }

      const isValid = await form.trigger(fieldsToValidate);

      if (!isValid) return;

      setDirection(index > currentStepIndex ? "forward" : "backward");
      setCurrentStepIndex(index);
    },
    [stepNames, currentStepIndex, highestCompletedStep, form, getFieldsForStep],
  );

  // -----------------------------
  // RESET
  // -----------------------------
  const resetForm = useCallback(() => {
    // 1. Sinaliza para o watch ignorar os próximos disparos
    isResettingRef.current = true;

    // 2. Remove a chave do storage ANTES do reset disparar o watch
    clearStorage();

    // 3. Reseta o formulário (vai disparar o watch, que será ignorado)
    form.reset(initialDefaultValues.current);
    form.clearErrors();

    // 4. Reseta o estado de navegação
    setCurrentStepIndex(0);
    setHighestCompletedStep(0);
    setDirection(undefined);

    // 5. Libera a flag no próximo tick, após o watch ter processado o reset
    setTimeout(() => {
      isResettingRef.current = false;
    }, 0);
  }, [form, clearStorage]);

  // -----------------------------
  // RETURN
  // -----------------------------
  return useMemo(
    () => ({
      form,

      currentStep: stepNames[currentStepIndex],
      currentStepIndex,

      totalSteps: stepNames.length,

      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === stepNames.length - 1,

      nextStep,
      prevStep,
      goToStep,

      direction,

      isValid: form.formState.isValid,
      errors: form.formState.errors,
      isSubmitting: form.formState.isSubmitting,

      hasSavedData,
      clearStorage,

      highestCompletedStep,
      getErrorsForStep,
      resetForm,
    }),
    [
      form,
      stepNames,
      currentStepIndex,
      nextStep,
      prevStep,
      goToStep,
      direction,
      hasSavedData,
      clearStorage,
      highestCompletedStep,
      getErrorsForStep,
      resetForm,
    ],
  );
}
