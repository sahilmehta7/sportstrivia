"use client";

import { ButtonsShowcase } from "@/components/showcase/sections/ButtonsShowcase";

export default function ButtonsShowcasePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Buttons</h1>
          <p className="text-muted-foreground mt-2">
            Reusable glassmorphism buttons with light/dark support and Heroicons.
          </p>
        </div>
        <ButtonsShowcase />
      </div>
    </div>
  );
}


