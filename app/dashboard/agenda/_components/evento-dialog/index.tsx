"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Info, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type EventoDialogDraft,
  useAgenda,
} from "@/components/sidebar/sidebar-agenda/agenda-context";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-drawer";
import { useAtualizarEvento, useCriarEvento, useExcluirEvento } from "../engine/useAgendamentos";
import { EventoForm } from "./form";
import { type EventoFormSchema, eventoFormSchema } from "./schema";

type EscopoRecorrencia = "ESTE" | "DAQUI_PRA_FRENTE";

const FORM_INICIAL: EventoFormSchema = {
  titulo: "",
  data: "",
  horaInicio: "08:00",
  horaFim: "09:00",
  recorrencia: "NENHUMA",
  recorrenciaAte: "",
  observacao: "",
};

const RECORRENCIA_LABEL: Record<NonNullable<EventoFormSchema["recorrencia"]>, string> = {
  NENHUMA: "Sem recorrência",
  DIARIA: "Diária",
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
  ANUAL: "Anual",
};

function formatarDataCompleta(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${data}T00:00:00`));
}

function montarPayload(form: EventoFormSchema, confirmarConflito: boolean) {
  return {
    titulo: form.titulo.trim() || "Sem título",
    data: form.data,
    horaInicio: form.horaInicio,
    horaFim: form.horaFim,
    recorrencia: form.recorrencia,
    recorrenciaAte: form.recorrenciaAte || undefined,
    observacao: form.observacao,
    confirmarConflito,
  };
}

export function EventoDialog() {
  const { abrirEditarEvento, eventoDialogDraft, fecharEventoDialog } = useAgenda();
  const criarEvento = useCriarEvento();
  const atualizarEvento = useAtualizarEvento();
  const [mostrarConflito, setMostrarConflito] = useState(false);
  const [mostrarEscopoEdicao, setMostrarEscopoEdicao] = useState(false);
  const [escopoEdicao, setEscopoEdicao] = useState<EscopoRecorrencia | undefined>();
  const emDetalhes = eventoDialogDraft?.modo === "detalhes";
  const emEdicao = eventoDialogDraft?.modo === "editar";
  const editandoRecorrente =
    emEdicao &&
    Boolean(eventoDialogDraft?.recorrencia) &&
    eventoDialogDraft?.recorrencia !== "NENHUMA";
  const loading = criarEvento.isPending || atualizarEvento.isPending;

  const form = useForm<EventoFormSchema>({
    defaultValues: FORM_INICIAL,
    mode: "onBlur",
    resolver: zodResolver(eventoFormSchema),
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!eventoDialogDraft) {
      form.reset(FORM_INICIAL);
      setMostrarConflito(false);
      setMostrarEscopoEdicao(false);
      setEscopoEdicao(undefined);
      return;
    }

    form.reset({
      titulo: eventoDialogDraft.titulo ?? "",
      data: eventoDialogDraft.data,
      horaInicio: eventoDialogDraft.horaInicio,
      horaFim: eventoDialogDraft.horaFim,
      recorrencia: eventoDialogDraft.recorrencia ?? "NENHUMA",
      recorrenciaAte: eventoDialogDraft.recorrenciaAte ?? "",
      observacao: eventoDialogDraft.observacao ?? "",
    });
  }, [eventoDialogDraft, form]);

  async function executarMutacao(
    payload: ReturnType<typeof montarPayload>,
    escopoRecorrencia: EscopoRecorrencia | undefined,
  ) {
    if (!emEdicao) {
      return criarEvento.mutateAsync(payload);
    }

    return atualizarEvento.mutateAsync({
      id: eventoDialogDraft?.eventoId ?? "",
      dataOriginal: eventoDialogDraft?.dataOriginal ?? eventoDialogDraft?.data,
      escopoRecorrencia,
      ...payload,
    });
  }

  async function submit(
    formData: EventoFormSchema,
    confirmarConflito = false,
    escopoRecorrencia = escopoEdicao,
  ) {
    if (editandoRecorrente && !escopoRecorrencia) {
      setMostrarEscopoEdicao(true);
      return;
    }

    const result = await executarMutacao(
      montarPayload(formData, confirmarConflito),
      escopoRecorrencia,
    );

    if (result.success) {
      toast.success(emEdicao ? "Evento atualizado com sucesso." : "Evento criado com sucesso.");
      fecharEventoDialog();
      return;
    }

    if (result.type === "conflict") {
      setEscopoEdicao(escopoRecorrencia);
      setMostrarConflito(true);
      return;
    }

    toast.error(result.message);
  }

  function submitFormulario(confirmarConflito = false, escopoRecorrencia = escopoEdicao) {
    form.handleSubmit((formData) => submit(formData, confirmarConflito, escopoRecorrencia))();
  }

  const resultadoMutacao = emEdicao ? atualizarEvento.data : criarEvento.data;

  const conflitos =
    resultadoMutacao?.success || resultadoMutacao?.type !== "conflict"
      ? []
      : resultadoMutacao.conflitos;

  return (
    <>
      <Dialog
        open={Boolean(eventoDialogDraft)}
        onOpenChange={(open) => !open && fecharEventoDialog()}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {emDetalhes ? "Detalhes do evento" : emEdicao ? "Editar evento" : "Novo evento"}
            </DialogTitle>
            <DialogDescription>
              {emDetalhes
                ? "Informações completas do compromisso selecionado."
                : emEdicao
                  ? "Atualize data, horário e detalhes do evento."
                  : "Cadastre um evento único ou recorrente."}
            </DialogDescription>
          </DialogHeader>

          {emDetalhes && eventoDialogDraft ? (
            <EventoDetalhesReadonly
              evento={eventoDialogDraft}
              onClose={fecharEventoDialog}
              onEdit={() => abrirEditarEvento({ ...eventoDialogDraft, modo: "editar" })}
            />
          ) : (
            <EventoForm
              emEdicao={emEdicao}
              form={form}
              loading={loading}
              onCancel={fecharEventoDialog}
              onSubmit={() => submitFormulario()}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={mostrarEscopoEdicao} onOpenChange={setMostrarEscopoEdicao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quer alterar somente esse registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha se a alteração vale só para esse registro ou daqui pra frente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMostrarEscopoEdicao(false);
                setEscopoEdicao("ESTE");
                submitFormulario(false, "ESTE");
              }}
            >
              Somente este registro
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setMostrarEscopoEdicao(false);
                setEscopoEdicao("DAQUI_PRA_FRENTE");
                submitFormulario(false, "DAQUI_PRA_FRENTE");
              }}
            >
              Daqui pra frente também
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={mostrarConflito} onOpenChange={setMostrarConflito}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Horário já ocupado</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um evento nesse intervalo. Se quiser, você ainda pode salvar assim mesmo.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 text-sm">
            {conflitos.map((conflito) => (
              <div key={conflito.id} className="rounded-md border px-3 py-2">
                <div className="font-medium">{conflito.titulo}</div>
                <div className="text-muted-foreground">
                  {conflito.horaInicio} - {conflito.horaFim}
                </div>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => submitFormulario(true, escopoEdicao)}>
              Prosseguir mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EventoDetalhesReadonly({
  evento,
  onClose,
  onEdit,
}: {
  evento: EventoDialogDraft;
  onClose: () => void;
  onEdit: () => void;
}) {
  const excluirEvento = useExcluirEvento();
  const [mostrarExclusao, setMostrarExclusao] = useState(false);
  const dataOriginalFormatada =
    evento.dataOriginal && evento.dataOriginal !== evento.data
      ? formatarDataCompleta(evento.dataOriginal)
      : null;
  const isRecorrente = Boolean(evento.recorrencia) && evento.recorrencia !== "NENHUMA";

  return (
    <>
      <div className="grid gap-4">
        <div className="grid gap-3 rounded-md border p-4 text-sm">
          <div className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">Título</span>
            <span className="font-medium text-foreground">{evento.titulo || "Sem título"}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">Data</span>
              <span className="capitalize">
                <CalendarClock className="mr-1 inline size-3.5 text-muted-foreground" />
                {formatarDataCompleta(evento.data)}
              </span>
            </div>

            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">Horário</span>
              <span className="tabular-nums">
                {evento.horaInicio} - {evento.horaFim}
              </span>
            </div>
          </div>

          {dataOriginalFormatada && (
            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">Data original</span>
              <span className="capitalize">
                <RefreshCw className="mr-1 inline size-3.5 text-muted-foreground" />
                {dataOriginalFormatada}
              </span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">Recorrência</span>
              <span>{RECORRENCIA_LABEL[evento.recorrencia ?? "NENHUMA"]}</span>
            </div>

            {evento.recorrenciaAte && (
              <div className="grid gap-1">
                <span className="text-xs font-medium text-muted-foreground">Válido até</span>
                <span>{formatarDataCompleta(evento.recorrenciaAte)}</span>
              </div>
            )}
          </div>

          {evento.observacao && (
            <div className="grid gap-1">
              <span className="text-xs font-medium text-muted-foreground">Observação</span>
              <span className="whitespace-pre-wrap">
                <Info className="mr-1 inline size-3.5 text-muted-foreground" />
                {evento.observacao}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setMostrarExclusao(true)}
            disabled={excluirEvento.isPending}
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
          <Button type="button" onClick={onEdit}>
            <Pencil className="size-4" />
            Editar
          </Button>
        </DialogFooter>
      </div>

      <AlertDialog open={mostrarExclusao} onOpenChange={setMostrarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRecorrente ? "Excluir evento recorrente?" : "Excluir evento?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRecorrente
                ? "Escolha se deseja excluir somente esse evento ou daqui pra frente também."
                : "Esta ação remove o evento permanentemente."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            {isRecorrente ? (
              <>
                <AlertDialogAction
                  onClick={async () => {
                    const result = await excluirEvento.mutateAsync({
                      id: evento.eventoId ?? "",
                      dataOriginal: evento.dataOriginal,
                      escopoRecorrencia: "ESTE",
                    });

                    if (!result.success) {
                      toast.error(result.errorMessage ?? "Não foi possível excluir o evento.");
                      return;
                    }

                    toast.success("Ocorrência excluída.");
                    onClose();
                  }}
                >
                  Somente este registro
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={async () => {
                    const result = await excluirEvento.mutateAsync({
                      id: evento.eventoId ?? "",
                      dataOriginal: evento.dataOriginal,
                      escopoRecorrencia: "DAQUI_PRA_FRENTE",
                    });

                    if (!result.success) {
                      toast.error(result.errorMessage ?? "Não foi possível excluir o evento.");
                      return;
                    }

                    toast.success("Eventos futuros excluídos.");
                    onClose();
                  }}
                >
                  Daqui pra frente também
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction
                onClick={async () => {
                  const result = await excluirEvento.mutateAsync({
                    id: evento.eventoId ?? "",
                  });

                  if (!result.success) {
                    toast.error(result.errorMessage ?? "Não foi possível excluir o evento.");
                    return;
                  }

                  toast.success("Evento excluído.");
                  onClose();
                }}
              >
                Excluir
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
