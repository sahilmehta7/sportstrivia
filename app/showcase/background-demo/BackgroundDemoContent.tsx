"use client";

import { ShowcasePage } from "@/components/showcase/ShowcasePage";
import { Card } from "@/components/ui/card";
import { getGlassCard } from "@/lib/showcase-theme";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { cn } from "@/lib/utils";

export function BackgroundDemoContent() {
  const { theme } = useShowcaseTheme();

  return (
    <ShowcasePage
      title="Background Demo"
      subtitle="A minimal example showing proper background switching between light and dark modes"
      badge="REFERENCE"
      variant="default"
      breadcrumbs={[{ label: "UI Components", href: "/showcase" }, { label: "Background Demo" }]}
    >
      <div className="space-y-8">
        {/* Instructions */}
        <Card className={cn("p-6", getGlassCard(theme))}>
          <h2 className={cn("mb-4 text-2xl font-bold", theme === "light" ? "text-slate-900" : "text-white")}>
            How This Works
          </h2>
          <ul className={cn("space-y-2 text-sm", theme === "light" ? "text-slate-600" : "text-white/70")}>
            <li>• The background uses <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">ShowcasePage</code> component</li>
            <li>• Light mode: Gradient background from white to slate</li>
            <li>• Dark mode: Solid <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">bg-slate-950</code> background</li>
            <li>• Blur circles are animated and adjust opacity for each mode</li>
            <li>• Glassmorphism cards adapt to theme</li>
          </ul>
        </Card>

        {/* Background Reference */}
        <Card className={cn("p-6", getGlassCard(theme))}>
          <h3 className={cn("mb-4 text-xl font-semibold", theme === "light" ? "text-slate-900" : "text-white")}>
            Background Implementation
          </h3>
          <div className={cn("space-y-3 text-sm font-mono", theme === "light" ? "text-slate-700" : "text-white/80")}>
            <div className="rounded-lg bg-slate-100 dark:bg-slate-900 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">showcase-theme.ts</div>
              <pre className="text-xs overflow-x-auto">
{`export function getBackgroundVariant(theme: ShowcaseTheme) {
  return theme === "light"
    ? "bg-gradient-to-br from-white/80 via-slate-50/90 to-blue-50/80"
    : "bg-slate-950";
}`}
              </pre>
            </div>
          </div>
        </Card>

        {/* Testing Cards */}
        <Card className={cn("p-6", getGlassCard(theme))}>
          <h3 className={cn("mb-4 text-xl font-semibold", theme === "light" ? "text-slate-900" : "text-white")}>
            Theme Test
          </h3>
          <p className={cn("text-sm", theme === "light" ? "text-slate-600" : "text-white/70")}>
            Toggle the theme using the button in the header to see how the background changes.
            In dark mode, you should see a solid slate-950 background, while light mode shows a gradient.
          </p>
        </Card>

        {/* Visual Indicator */}
        <div className={cn(
          "rounded-2xl p-8 text-center border-2",
          theme === "light"
            ? "bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200"
            : "bg-slate-900 border-slate-700"
        )}>
          <div className={cn("text-6xl mb-4", theme === "light" ? "text-blue-600" : "text-emerald-400")}>
            {theme === "light" ? "☀️" : "🌙"}
          </div>
          <p className={cn("text-lg font-semibold", theme === "light" ? "text-blue-900" : "text-white")}>
            Current Mode: {theme === "light" ? "Light" : "Dark"}
          </p>
        </div>
      </div>
    </ShowcasePage>
  );
}

