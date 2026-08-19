"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import {
  AlertDialogDrawer,
  AlertDialogDrawerAction,
  AlertDialogDrawerCancel,
  AlertDialogDrawerContent,
  AlertDialogDrawerDescription,
  AlertDialogDrawerFooter,
  AlertDialogDrawerHeader,
  AlertDialogDrawerTitle,
} from "@/components/ui/dialog-drawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ActionMenuVariant = "default" | "destructive";

type ActionMenuConfirm = {
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
};

export type ActionMenuItem = {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  href?: string;
  onSelect?: () => void | Promise<void>;
  disabled?: boolean;
  hidden?: boolean;
  variant?: ActionMenuVariant;
  confirm?: ActionMenuConfirm;
};

export type ActionMenuSection = {
  id: string;
  label?: string;
  items: ActionMenuItem[];
};

type ActionMenuProps = {
  sections: ActionMenuSection[];
  triggerTitle: string;
  contentClassName?: string;
};

function ActionMenuItemContent({
  description,
  icon,
  label,
  variant = "default",
}: {
  description: string;
  icon: ReactNode;
  label: string;
  variant?: ActionMenuVariant;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>

      <div className="flex flex-col">
        <span
          className={
            variant === "destructive"
              ? "font-medium text-destructive"
              : "font-medium text-foreground"
          }
        >
          {label}
        </span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}

export function ActionMenu({ sections, triggerTitle, contentClassName = "w-72" }: ActionMenuProps) {
  const router = useRouter();
  const [confirmItem, setConfirmItem] = useState<ActionMenuItem | null>(null);

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.hidden),
    }))
    .filter((section) => section.items.length > 0);

  const handleSelect = (item: ActionMenuItem) => {
    if (item.onSelect) return item.onSelect;
    if (!item.href) return undefined;

    const href = item.href;
    return () => router.push(href);
  };

  async function handleConfirmAction() {
    if (!confirmItem) {
      return;
    }

    await handleSelect(confirmItem)?.();
    setConfirmItem(null);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="icon" variant="outline" title={triggerTitle}>
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end" className={contentClassName}>
          {visibleSections.map((section, index) => (
            <div key={section.id}>
              {index > 0 && <DropdownMenuSeparator />}

              <DropdownMenuGroup>
                {section.label ? <DropdownMenuLabel>{section.label}</DropdownMenuLabel> : null}

                {section.items.map((item) => {
                  const variant = item.variant ?? "default";
                  const content = (
                    <ActionMenuItemContent
                      description={item.description}
                      icon={item.icon}
                      label={item.label}
                      variant={variant}
                    />
                  );

                  if (item.confirm) {
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        disabled={item.disabled}
                        onClick={() => setConfirmItem(item)}
                        variant={variant}
                      >
                        {content}
                      </DropdownMenuItem>
                    );
                  }

                  if (item.href) {
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        disabled={item.disabled}
                        variant={variant}
                        render={<Link href={item.href}>{content}</Link>}
                      />
                    );
                  }

                  return (
                    <DropdownMenuItem
                      key={item.id}
                      disabled={item.disabled}
                      onClick={item.onSelect}
                      variant={variant}
                    >
                      {content}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogDrawer
        onOpenChange={(open) => !open && setConfirmItem(null)}
        open={Boolean(confirmItem)}
      >
        <AlertDialogDrawerContent>
          <AlertDialogDrawerHeader>
            <AlertDialogDrawerTitle>{confirmItem?.confirm?.title}</AlertDialogDrawerTitle>
            <AlertDialogDrawerDescription>
              {confirmItem?.confirm?.description}
            </AlertDialogDrawerDescription>
          </AlertDialogDrawerHeader>
          <AlertDialogDrawerFooter>
            <AlertDialogDrawerCancel>
              {confirmItem?.confirm?.cancelText ?? "Cancelar"}
            </AlertDialogDrawerCancel>
            <AlertDialogDrawerAction onClick={handleConfirmAction}>
              {confirmItem?.confirm?.confirmText ?? "Confirmar"}
            </AlertDialogDrawerAction>
          </AlertDialogDrawerFooter>
        </AlertDialogDrawerContent>
      </AlertDialogDrawer>
    </>
  );
}
