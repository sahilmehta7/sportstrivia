"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva(
  [
    "inline-flex items-center justify-center",
    "text-muted-foreground",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "h-10 rounded-lg bg-muted p-1",
        glass: "h-10 rounded-lg glass p-1",
        underline: "h-auto gap-4 bg-transparent border-b border-border pb-0",
        pills: "h-auto gap-2 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
  VariantProps<typeof tabsListVariants> { }

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      tabsListVariants({ variant }),
      // Mobile horizontal scroll
      "overflow-x-auto scrollbar-hide",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "px-3 py-1.5 text-sm font-medium",
    "ring-offset-background transition-all duration-base",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    // Touch-friendly
    "min-h-touch touch-target",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "rounded-md",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        ].join(" "),
        glass: [
          "rounded-md",
          "data-[state=active]:glass-elevated data-[state=active]:text-foreground",
        ].join(" "),
        underline: [
          "border-b-2 border-transparent rounded-none pb-2 -mb-px",
          "data-[state=active]:border-primary data-[state=active]:text-foreground",
        ].join(" "),
        pills: [
          "rounded-full border border-transparent",
          "data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
        ].join(" "),
        neon: [
          "rounded-md",
          "data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-neon-cyan",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
  VariantProps<typeof tabsTriggerVariants> { }

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      // Animation
      "animate-slide-up",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
