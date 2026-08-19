"use client";

import type { FieldError } from "react-hook-form";

interface FormErrorMessageProps {
  error?: FieldError;
}

export function FormErrorMessage({ error }: FormErrorMessageProps) {
  if (!error?.message) return null;

  return <p className="text-sm text-red-500">{error.message}</p>;
}
