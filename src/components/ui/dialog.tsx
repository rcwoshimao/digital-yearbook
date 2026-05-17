"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from "react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`fixed inset-0 z-50 bg-black/50 ${className}`}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { children: ReactNode }
>(({ children, className = "", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={`fixed left-1/2 top-1/2 z-50 w-[min(92vw,42rem)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ring-1 ring-stone-200 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-2 ${className}`}>{children}</div>;
}

export function DialogTitle({
  children,
  className = "",
  ...props
}: DialogPrimitive.DialogTitleProps & { children: ReactNode }) {
  return (
    <DialogPrimitive.Title className={`text-xl font-bold text-yearbook-ink ${className}`} {...props}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({
  children,
  className = "",
  ...props
}: DialogPrimitive.DialogDescriptionProps & { children: ReactNode }) {
  return (
    <DialogPrimitive.Description className={`text-sm text-stone-600 ${className}`} {...props}>
      {children}
    </DialogPrimitive.Description>
  );
}
