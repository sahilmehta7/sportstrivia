"use client";

import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { ShowcaseIconButton } from "@/components/showcase/ui/buttons/IconButton";
import type { ButtonSize, ButtonVariant } from "@/components/showcase/ui/buttons/buttonTheme";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const variants: ButtonVariant[] = [
  "primary",
  "secondary",
  "destructive",
  "success",
  "warning",
  "info",
  "outline",
  "ghost",
  "link",
];

const sizes: ButtonSize[] = ["xs", "sm", "md", "lg"];

const getIconForVariant = (variant: ButtonVariant) => {
  switch (variant) {
    case "success":
      return <CheckIcon className="h-4 w-4" />;
    case "warning":
      return <ExclamationTriangleIcon className="h-4 w-4" />;
    case "info":
      return <InformationCircleIcon className="h-4 w-4" />;
    case "destructive":
      return <TrashIcon className="h-4 w-4" />;
    default:
      return <ArrowRightIcon className="h-4 w-4" />;
  }
};

export function ButtonsShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)}>
      <header className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Buttons</h1>
        <p className="text-muted-foreground mt-2">
          Glassmorphism buttons with light/dark support, emphasis and semantic variants, and sizes.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Variants × Sizes</h2>
        <div className="grid gap-6">
          {variants.map((variant) => (
            <div key={variant} className="space-y-3">
              <p className="text-sm font-medium capitalize">{variant}</p>
              <div className="flex flex-wrap items-center gap-3">
                {sizes.map((size) => (
                  <ShowcaseButton
                    key={`${variant}-${size}`}
                    variant={variant}
                    size={size}
                  >
                    {variant === "link" ? "Learn more" : "Button"}
                  </ShowcaseButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">With Icons</h2>
        <div className="grid gap-6">
          {variants.filter((v) => v !== "link").map((variant) => (
            <div key={`icons-${variant}`} className="space-y-3">
              <p className="text-sm font-medium capitalize">{variant}</p>
              <div className="flex flex-wrap items-center gap-3">
                {sizes.map((size) => (
                  <ShowcaseButton
                    key={`${variant}-icon-${size}`}
                    variant={variant}
                    size={size}
                    icon={getIconForVariant(variant)}
                    iconPosition="start"
                  >
                    Continue
                  </ShowcaseButton>
                ))}
                {sizes.map((size) => (
                  <ShowcaseButton
                    key={`${variant}-icon-end-${size}`}
                    variant={variant}
                    size={size}
                    icon={getIconForVariant(variant)}
                    iconPosition="end"
                  >
                    Continue
                  </ShowcaseButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Icon-only</h2>
        <div className="flex flex-wrap items-center gap-4">
          {(["primary", "secondary", "success", "warning", "info", "destructive", "ghost", "outline"] as ButtonVariant[]).map((variant) => (
            <div key={`icononly-${variant}`} className="flex items-center gap-2">
              {sizes.map((size) => (
                <ShowcaseIconButton
                  key={`${variant}-icononly-${size}`}
                  variant={variant}
                  size={size}
                  ariaLabel={`${variant} action`}
                >
                  {getIconForVariant(variant)}
                </ShowcaseIconButton>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold">Loading & Disabled</h2>
        <div className="flex flex-wrap items-center gap-3">
          <ShowcaseButton variant="primary" isLoading>
            Processing
          </ShowcaseButton>
          <ShowcaseButton variant="secondary" disabled>
            Disabled
          </ShowcaseButton>
          <ShowcaseButton variant="destructive" isLoading icon={<TrashIcon className="h-4 w-4" />} iconPosition="end">
            Deleting
          </ShowcaseButton>
          <ShowcaseIconButton variant="ghost" isLoading ariaLabel="loading icon" />
        </div>
      </section>
    </div>
  );
}


