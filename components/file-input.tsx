"use client";

import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useId, useState } from "react";

type FileInputProps = {
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  multiple?: boolean;
  onChange?: (file: File | undefined) => void;
  onChangeMultiple?: (files: File[]) => void;
};

export function FileInput({
  accept,
  disabled,
  placeholder = "Selecionar arquivo",
  className,
  multiple,
  onChange,
  onChangeMultiple,
}: FileInputProps) {
  const id = useId();
  const [fileName, setFileName] = useState("");

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);

          setFileName(
            files.length > 1 ? `${files.length} arquivos selecionados` : (files[0]?.name ?? ""),
          );
          onChange?.(files[0]);
          onChangeMultiple?.(files);
        }}
      />

      <label
        htmlFor={id}
        className={cn(
          "border-input bg-background hover:bg-accent hover:text-accent-foreground",
          "inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors",
        )}
      >
        <Upload className="size-4" />
        {placeholder}
      </label>

      <span className="text-muted-foreground truncate text-sm">
        {fileName || "Nenhum arquivo selecionado"}
      </span>
    </div>
  );
}
