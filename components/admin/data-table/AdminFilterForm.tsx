import { FormHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminFilterFormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
}

export function AdminFilterForm({ children, className, ...props }: AdminFilterFormProps) {
  return (
    <form
      {...props}
      className={cn(
        "mb-6 grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-4",
        className
      )}
    >
      {children}
    </form>
  );
}
