"use client";

import { XIcon } from "lucide-react";
import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { ScrollArea } from "./scroll-area";

const DialogDrawerContext = React.createContext<boolean | null>(null);

function useDialogDrawerIsMobile() {
  const contextIsMobile = React.useContext(DialogDrawerContext);
  const fallbackIsMobile = useIsMobile();

  return contextIsMobile ?? fallbackIsMobile;
}

function DialogDrawer(props: React.ComponentProps<typeof Dialog>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    const { onOpenChange, ...drawerProps } = props;

    return (
      <DialogDrawerContext.Provider value={isMobile}>
        <Drawer
          showSwipeHandle
          swipeDirection="down"
          onOpenChange={(open, eventDetails) => onOpenChange?.(open, eventDetails as never)}
          {...drawerProps}
        />
      </DialogDrawerContext.Provider>
    );
  }

  return (
    <DialogDrawerContext.Provider value={isMobile}>
      <Dialog {...props} />
    </DialogDrawerContext.Provider>
  );
}

function DialogDrawerTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerTrigger {...props} />;
  }

  return <DialogTrigger {...props} />;
}

function DialogDrawerContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    const drawerProps = props as React.ComponentProps<typeof DrawerContent>;

    return (
      <DrawerContent className={cn("max-h-[calc(100dvh-1rem)]", className)} {...drawerProps}>
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid gap-4 p-4">{children}</div>
        </ScrollArea>

        {showCloseButton && (
          <DrawerClose
            data-slot="dialog-drawer-close"
            render={
              <Button variant="ghost" className="absolute right-2 top-2 z-10" size="icon-sm" />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DrawerClose>
        )}
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={className} showCloseButton={showCloseButton} {...props}>
      {children}
    </DialogContent>
  );
}

function DialogDrawerHeader({ className, ...props }: React.ComponentProps<typeof DialogHeader>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerHeader className={cn("pr-8", className)} {...props} />;
  }

  return <DialogHeader className={className} {...props} />;
}

function DialogDrawerFooter(props: React.ComponentProps<typeof DialogFooter>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerFooter {...props} />;
  }

  return <DialogFooter {...props} />;
}

function DialogDrawerTitle(props: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerTitle {...props} />;
  }

  return <DialogTitle {...props} />;
}

function DialogDrawerDescription(props: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerDescription {...props} />;
  }

  return <DialogDescription {...props} />;
}

function AlertDialogDrawer(props: React.ComponentProps<typeof AlertDialog>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    const { onOpenChange, ...drawerProps } = props;

    return (
      <DialogDrawerContext.Provider value={isMobile}>
        <Drawer
          showSwipeHandle
          swipeDirection="down"
          onOpenChange={(open, eventDetails) => onOpenChange?.(open, eventDetails as never)}
          {...drawerProps}
        />
      </DialogDrawerContext.Provider>
    );
  }

  return (
    <DialogDrawerContext.Provider value={isMobile}>
      <AlertDialog {...props} />
    </DialogDrawerContext.Provider>
  );
}

function AlertDialogDrawerTrigger(props: React.ComponentProps<typeof AlertDialogTrigger>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerTrigger {...props} />;
  }

  return <AlertDialogTrigger {...props} />;
}

function AlertDialogDrawerContent({
  className,
  children,
  size,
  ...props
}: React.ComponentProps<typeof AlertDialogContent>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    const drawerProps = props as React.ComponentProps<typeof DrawerContent>;

    return (
      <DrawerContent className={cn("max-h-[calc(100dvh-1rem)]", className)} {...drawerProps}>
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid gap-4 p-4">{children}</div>
        </ScrollArea>
      </DrawerContent>
    );
  }

  return (
    <AlertDialogContent className={className} size={size} {...props}>
      {children}
    </AlertDialogContent>
  );
}

function AlertDialogDrawerHeader(props: React.ComponentProps<typeof AlertDialogHeader>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerHeader className={cn("text-center", props.className)} {...props} />;
  }

  return <AlertDialogHeader {...props} />;
}

function AlertDialogDrawerFooter(props: React.ComponentProps<typeof AlertDialogFooter>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerFooter className={cn("pt-0", props.className)} {...props} />;
  }

  return <AlertDialogFooter {...props} />;
}

function AlertDialogDrawerTitle(props: React.ComponentProps<typeof AlertDialogTitle>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerTitle {...props} />;
  }

  return <AlertDialogTitle {...props} />;
}

function AlertDialogDrawerDescription(props: React.ComponentProps<typeof AlertDialogDescription>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <DrawerDescription {...props} />;
  }

  return <AlertDialogDescription {...props} />;
}

function AlertDialogDrawerAction(props: React.ComponentProps<typeof AlertDialogAction>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    return <Button {...props} />;
  }

  return <AlertDialogAction {...props} />;
}

function AlertDialogDrawerCancel(props: React.ComponentProps<typeof AlertDialogCancel>) {
  const isMobile = useDialogDrawerIsMobile();

  if (isMobile) {
    const { variant = "outline", size = "default", ...closeProps } = props;

    return <DrawerClose render={<Button variant={variant} size={size} />} {...closeProps} />;
  }

  return <AlertDialogCancel {...props} />;
}

export {
  AlertDialogDrawer as AlertDialog,
  AlertDialogDrawer,
  AlertDialogDrawerAction as AlertDialogAction,
  AlertDialogDrawerAction,
  AlertDialogDrawerCancel as AlertDialogCancel,
  AlertDialogDrawerCancel,
  AlertDialogDrawerContent as AlertDialogContent,
  AlertDialogDrawerContent,
  AlertDialogDrawerDescription as AlertDialogDescription,
  AlertDialogDrawerDescription,
  AlertDialogDrawerFooter as AlertDialogFooter,
  AlertDialogDrawerFooter,
  AlertDialogDrawerHeader as AlertDialogHeader,
  AlertDialogDrawerHeader,
  AlertDialogDrawerTitle as AlertDialogTitle,
  AlertDialogDrawerTitle,
  AlertDialogDrawerTrigger as AlertDialogTrigger,
  AlertDialogDrawerTrigger,
  DialogDrawer as Dialog,
  DialogDrawer,
  DialogDrawerContent as DialogContent,
  DialogDrawerContent,
  DialogDrawerDescription as DialogDescription,
  DialogDrawerDescription,
  DialogDrawerFooter as DialogFooter,
  DialogDrawerFooter,
  DialogDrawerHeader as DialogHeader,
  DialogDrawerHeader,
  DialogDrawerTitle as DialogTitle,
  DialogDrawerTitle,
  DialogDrawerTrigger as DialogTrigger,
  DialogDrawerTrigger,
};
