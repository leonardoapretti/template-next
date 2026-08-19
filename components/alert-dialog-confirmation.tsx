// alert-dialog-confirmation.tsx
"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import {
  AlertDialogDrawer,
  AlertDialogDrawerAction,
  AlertDialogDrawerCancel,
  AlertDialogDrawerContent,
  AlertDialogDrawerDescription,
  AlertDialogDrawerFooter,
  AlertDialogDrawerHeader,
  AlertDialogDrawerTitle,
  AlertDialogDrawerTrigger,
} from "./ui/dialog-drawer";

interface AlertDialogConfirmationProps {
  trigger: ReactElement;
  title?: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
}

export function AlertDialogConfirmation({
  trigger,
  title = "Tem certeza que deseja excluir?",
  description = "Esta ação não pode ser desfeita. Isso excluirá permanentemente.",
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  onConfirm,
}: AlertDialogConfirmationProps) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    setOpen(false);
    void onConfirm();
  }

  return (
    <AlertDialogDrawer onOpenChange={setOpen} open={open}>
      <AlertDialogDrawerTrigger render={trigger} />
      <AlertDialogDrawerContent className="max-w-[calc(100%-1rem)] sm:max-w-md">
        <AlertDialogDrawerHeader>
          <AlertDialogDrawerTitle className="wrap-break-word">{title}</AlertDialogDrawerTitle>
          <AlertDialogDrawerDescription className="wrap-break-word">
            {description}
          </AlertDialogDrawerDescription>
        </AlertDialogDrawerHeader>
        <AlertDialogDrawerFooter className="sm:flex-wrap">
          <AlertDialogDrawerCancel className="min-w-0 whitespace-normal">
            {cancelText}
          </AlertDialogDrawerCancel>
          <AlertDialogDrawerAction className="min-w-0 whitespace-normal" onClick={handleConfirm}>
            {confirmText}
          </AlertDialogDrawerAction>
        </AlertDialogDrawerFooter>
      </AlertDialogDrawerContent>
    </AlertDialogDrawer>
  );
}
