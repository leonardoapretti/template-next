"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { DatePickerField } from "@/components/date-picker-field";
import { FormErrorMessage } from "@/components/form-error-message";
import { HourPickerField } from "@/components/hour-picker-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EventoFormSchema } from "./schema";

type EventoFormProps = {
  emEdicao: boolean;
  form: UseFormReturn<EventoFormSchema>;
  loading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export function EventoForm({ emEdicao, form, loading, onCancel, onSubmit }: EventoFormProps) {
  const recorrencia = form.watch("recorrencia");

  return (
    <div className="grid gap-4">
      <Controller
        control={form.control}
        name="titulo"
        render={({ field, fieldState }) => (
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input {...field} placeholder="Ex.: Reunião, Consulta, Bloqueio" />
            <FormErrorMessage error={fieldState.error} />
          </div>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Controller
          control={form.control}
          name="data"
          render={({ field, fieldState }) => (
            <div className="grid gap-2 sm:col-span-1">
              <Label>Data</Label>
              <DatePickerField value={field.value} onChange={field.onChange} />
              <FormErrorMessage error={fieldState.error} />
            </div>
          )}
        />

        <Controller
          control={form.control}
          name="horaInicio"
          render={({ field, fieldState }) => (
            <div className="grid gap-2">
              <Label>Início</Label>
              <HourPickerField value={field.value} onChange={field.onChange} />
              <FormErrorMessage error={fieldState.error} />
            </div>
          )}
        />

        <Controller
          control={form.control}
          name="horaFim"
          render={({ field, fieldState }) => (
            <div className="grid gap-2">
              <Label>Fim</Label>
              <HourPickerField value={field.value} onChange={field.onChange} />
              <FormErrorMessage error={fieldState.error} />
            </div>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="recorrencia"
          render={({ field, fieldState }) => (
            <div className="grid gap-2">
              <Label>Recorrência</Label>
              <Select value={field.value} onValueChange={field.onChange} name={field.name}>
                <SelectTrigger className="w-full" aria-invalid={!!fieldState.error}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NENHUMA">Sem recorrência</SelectItem>
                  <SelectItem value="DIARIA">Diária</SelectItem>
                  <SelectItem value="SEMANAL">Semanal</SelectItem>
                  <SelectItem value="MENSAL">Mensal</SelectItem>
                  <SelectItem value="ANUAL">Anual</SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage error={fieldState.error} />
            </div>
          )}
        />

        {recorrencia !== "NENHUMA" ? (
          <Controller
            control={form.control}
            name="recorrenciaAte"
            render={({ field, fieldState }) => (
              <div className="grid gap-2">
                <Label>Repetir até</Label>
                <DatePickerField value={field.value} onChange={field.onChange} />
                <FormErrorMessage error={fieldState.error} />
              </div>
            )}
          />
        ) : null}
      </div>

      <Controller
        control={form.control}
        name="observacao"
        render={({ field, fieldState }) => (
          <div className="grid gap-2">
            <Label>Observação</Label>
            <Textarea {...field} placeholder="Detalhes adicionais do evento" rows={4} />
            <FormErrorMessage error={fieldState.error} />
          </div>
        )}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="button" onClick={onSubmit} disabled={loading}>
          {loading ? "Salvando..." : emEdicao ? "Salvar alterações" : "Salvar evento"}
        </Button>
      </div>
    </div>
  );
}
