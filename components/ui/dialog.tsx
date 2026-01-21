"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[60]",
      "bg-background/80 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const dialogContentVariants = cva(
  [
    "fixed z-[70] grid gap-4 p-4 sm:p-6 shadow-lg",
    "duration-base",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border bg-background",
        glass: "glass-elevated",
        neon: "border border-primary/30 bg-background shadow-neon-cyan",
      },
      position: {
        // Desktop: centered, Mobile: full-width bottom sheet
        center: [
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 rounded-t-xl max-h-[85vh]",
          // Desktop: centered
          "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:rounded-lg sm:max-h-[85vh] sm:w-full sm:max-w-lg",
          // Animations
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          "sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]",
          "sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
        ].join(" "),
        // Always centered (desktop behavior)
        "center-always": [
          "left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2",
          "w-[calc(100%-2rem)] max-w-lg rounded-lg",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        ].join(" "),
        // Full screen on mobile
        fullscreen: [
          "inset-0 sm:inset-auto",
          "sm:left-[50%] sm:top-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:rounded-lg sm:w-full sm:max-w-lg sm:max-h-[85vh]",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
      position: "center",
    },
  }
)

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  VariantProps<typeof dialogContentVariants> {
  hideClose?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, variant, position, hideClose = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ variant, position }), className)}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className={cn(
          "absolute right-4 top-4 rounded-sm",
          "opacity-70 transition-opacity hover:opacity-100",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:pointer-events-none",
          "touch-target min-h-touch min-w-touch flex items-center justify-center"
        )}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  dialogContentVariants,
}
