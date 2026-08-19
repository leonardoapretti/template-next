"use client";

import { FileText, UploadIcon, X } from "lucide-react";
import * as React from "react";
import Dropzone, {
  type DropzoneProps,
  type DropzoneState,
  type FileRejection,
} from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatarTamanhoArquivo } from "@/lib/utils/arquivo";
import { cn } from "@/lib/utils/index";

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Arquivos selecionados. */
  value?: File[];
  /** Chamado quando a seleção de arquivos muda. */
  onValueChange?: (files: File[]) => void;
  /** Tipos aceitos no formato do react-dropzone (ex: `{ "application/pdf": [] }`). */
  accept?: DropzoneProps["accept"];
  /** Tamanho máximo por arquivo, em bytes. */
  maxSize?: DropzoneProps["maxSize"];
  /** Quantidade máxima de arquivos. */
  maxFileCount?: DropzoneProps["maxFiles"];
  /** Progresso de envio por nome de arquivo (0-100), opcional. */
  progresses?: Record<string, number>;
  multiple?: boolean;
  disabled?: boolean;
}

function useFileUploaderDrop({
  files,
  maxFileCount,
  multiple,
  onValueChange,
}: {
  files: File[];
  maxFileCount: number;
  multiple: boolean;
  onValueChange?: (files: File[]) => void;
}) {
  return React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        toast.error("Não é possível enviar mais de 1 arquivo por vez.");
        return;
      }

      if (files.length + acceptedFiles.length > maxFileCount) {
        toast.error(`Não é possível enviar mais de ${maxFileCount} arquivos.`);
        return;
      }

      onValueChange?.([...files, ...acceptedFiles]);

      for (const { file } of rejectedFiles) {
        toast.error(`${file.name} foi rejeitado.`);
      }
    },
    [files, maxFileCount, multiple, onValueChange],
  );
}

export function FileUploader({
  value,
  onValueChange,
  progresses,
  accept = { "image/*": [] },
  maxSize = 1024 * 1024 * 2,
  maxFileCount = 1,
  multiple = false,
  disabled = false,
  className,
  ...dropzoneProps
}: FileUploaderProps) {
  const files = value ?? [];
  const onDrop = useFileUploaderDrop({ files, maxFileCount, multiple, onValueChange });

  function onRemove(index: number) {
    onValueChange?.(files.filter((_, i) => i !== index));
  }

  const isDisabled = disabled || files.length >= maxFileCount;

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden">
      <Dropzone
        accept={accept}
        disabled={isDisabled}
        maxFiles={maxFileCount}
        maxSize={maxSize}
        multiple={maxFileCount > 1 || multiple}
        onDrop={onDrop}
      >
        {(dropzoneState) => (
          <DropzoneArea
            dropzoneState={dropzoneState}
            files={files}
            maxFileCount={maxFileCount}
            maxSize={maxSize}
            className={className}
            dropzoneProps={dropzoneProps}
          />
        )}
      </Dropzone>

      {files.length > 0 && (
        <ScrollArea className="h-fit max-h-48 w-full">
          <div className="flex flex-col gap-3 pr-3">
            {files.map((file, index) => (
              <FileCard
                key={`${file.name}-${file.size}-${file.lastModified}`}
                file={file}
                progress={progresses?.[file.name]}
                onRemove={() => onRemove(index)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function dropzoneAreaClassName({
  hasFiles,
  reachedLimit,
  isDragActive,
  className,
}: {
  hasFiles: boolean;
  reachedLimit: boolean;
  isDragActive: boolean;
  className?: string;
}) {
  return cn(
    "group relative grid h-40 w-full place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    !reachedLimit && "cursor-pointer hover:bg-muted",
    isDragActive && "border-primary bg-primary/5",
    reachedLimit && "pointer-events-none opacity-60",
    hasFiles && !reachedLimit && "border-primary/60 bg-muted/40",
    className,
  );
}

function getDropzoneMessage({
  isDragActive,
  files,
  reachedLimit,
  maxFileCount,
  maxSize,
}: {
  isDragActive: boolean;
  files: File[];
  reachedLimit: boolean;
  maxFileCount: number;
  maxSize: number;
}) {
  if (isDragActive) {
    return {
      icon: <UploadIcon className="size-6 animate-bounce text-primary" />,
      title: "Solte os arquivos para enviá-los",
    };
  }

  if (files.length > 0) {
    return {
      icon: <FileText className="size-6 text-primary" />,
      title: files.length === 1 ? "1 arquivo selecionado" : `${files.length} arquivos selecionados`,
      description: reachedLimit
        ? `Limite máximo de ${maxFileCount} arquivo${maxFileCount > 1 ? "s" : ""} atingido`
        : "Clique ou arraste novos arquivos para adicionar",
    };
  }

  return {
    icon: <UploadIcon className="size-6 text-muted-foreground" />,
    title: "Arraste arquivos para cá ou clique para enviá-los",
    description:
      maxFileCount > 1
        ? `Até ${maxFileCount} arquivos de até ${formatarTamanhoArquivo(maxSize)} cada`
        : `Um arquivo com até ${formatarTamanhoArquivo(maxSize)}`,
  };
}

function DropzoneArea({
  dropzoneState: { getRootProps, getInputProps, isDragActive },
  files,
  maxFileCount,
  maxSize,
  className,
  dropzoneProps,
}: {
  dropzoneState: DropzoneState;
  files: File[];
  maxFileCount: number;
  maxSize: number;
  className?: string;
  dropzoneProps: React.HTMLAttributes<HTMLDivElement>;
}) {
  const hasFiles = files.length > 0;
  const reachedLimit = files.length >= maxFileCount;
  const message = getDropzoneMessage({ isDragActive, files, reachedLimit, maxFileCount, maxSize });

  return (
    <div
      {...getRootProps()}
      className={dropzoneAreaClassName({ hasFiles, reachedLimit, isDragActive, className })}
      {...dropzoneProps}
    >
      <input {...getInputProps()} />
      <DropzoneMessage {...message} />
    </div>
  );
}

function DropzoneMessage({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:px-5">
      <div className="rounded-full border border-dashed p-3">{icon}</div>
      <p className="font-semibold text-primary">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

function FileCard({
  file,
  progress,
  onRemove,
}: {
  file: File;
  progress?: number;
  onRemove: () => void;
}) {
  return (
    <div className="relative flex items-center gap-2.5">
      <FileText className="size-8 shrink-0 text-muted-foreground" />

      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <p className="line-clamp-1 text-sm font-medium text-foreground/80">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatarTamanhoArquivo(file.size)}</p>
        {progress !== undefined && <Progress value={progress} />}
      </div>

      <Button
        className="size-7 shrink-0"
        onClick={onRemove}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <X className="size-4" />
        <span className="sr-only">Remover arquivo</span>
      </Button>
    </div>
  );
}
