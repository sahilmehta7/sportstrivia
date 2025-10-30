"use client";

import { useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface StreamlinedQuizFormProps {
  children: ReactNode;
}

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({ title, description, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isOpen && <CardContent className="space-y-4">{children}</CardContent>}
    </Card>
  );
}

export function StreamlinedQuizForm({ children }: StreamlinedQuizFormProps) {
  return (
    <div className="space-y-4 pb-32">
      {children}
    </div>
  );
}
