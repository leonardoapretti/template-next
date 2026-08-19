"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  type ArrayPath,
  type Control,
  type FieldArrayWithId,
  type FieldValues,
  useFieldArray,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DynamicFieldArrayProps<T extends FieldValues> {
  control: Control<T>;
  name: ArrayPath<T>;
  label: string;
  addButtonLabel?: string;

  emptyItem: any;

  children: (index: number, field: FieldArrayWithId<T, ArrayPath<T>, "id">) => React.ReactNode;

  onAdd?: (append: (value: any) => void, emptyItem: any) => void;

  renderAddButton?: (args: { append: (value: any) => void; emptyItem: any }) => React.ReactNode;
  nomeRegistro?: string;
}

export function DynamicFieldArray<T extends FieldValues>({
  control,
  name,
  label,
  addButtonLabel = "Adicionar registro",
  emptyItem,
  children,
  onAdd,
  renderAddButton,
  nomeRegistro = "Registro",
}: DynamicFieldArrayProps<T>) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const handleAdd = () => {
    if (onAdd) {
      onAdd(append, emptyItem);
      return;
    }

    append(emptyItem);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Label>{label}</Label>

        {renderAddButton ? (
          renderAddButton({ append, emptyItem })
        ) : (
          <Button type="button" variant="outline" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      {/* ITEMS */}
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {nomeRegistro} #{index + 1}
            </p>

            <Button size="icon" type="button" variant="ghost" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {children(index, field)}
        </div>
      ))}
    </div>
  );
}
