export type ThemeVariant = "light" | "dark";

export function formatSeconds(totalSeconds: number) {
    const clamped = Number.isFinite(totalSeconds) ? Math.max(totalSeconds, 0) : 0;
    const minutes = Math.floor(clamped / 60);
    const seconds = clamped % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
}

/*
  "Minimal Athletic Pro Max" Design
  - Richer gradients, deeper diffs between layers
  - Sharper borders (1px) with high contrast in dark mode
  - "Athletic" typography: tighter tracking, uppercase labels
  - Interactive tactile feel
*/
export const variantStyles: Record<ThemeVariant, {
    wrapper: string;
    overlayA: string;
    overlayB: string;
    overlayC: string;
    card: string;
    helper: string;
    question: string;
    progressTrack: string;
    progressFill: string;
    timeLabel: string;
    timeValue: string;
    timeTrack: string;
    timeFill: string;
    answerBase: string; // Base layout
    answerIdle: string; // Default state
    answerSelected: string; // User picked this
    answerDisabled: string; // Locked state
    answerCorrect: string; // Revealed correct
    answerIncorrect: string; // Revealed wrong
    imageFrame: string;
    nextButton: string;
    nextDisabled: string;
}> = {
    light: {
        wrapper:
            "bg-background text-foreground shadow-sm ring-1 ring-border",
        overlayA: "bg-amber-300/40 mix-blend-multiply filter blur-3xl",
        overlayB: "bg-orange-300/40 mix-blend-multiply filter blur-3xl",
        overlayC: "bg-rose-300/40 mix-blend-multiply filter blur-3xl",
        card:
            "bg-card text-card-foreground shadow-sm ring-1 ring-border",
        helper: "text-slate-500 font-bold",
        question: "text-slate-900 tracking-tight",
        progressTrack: "bg-slate-200/50",
        progressFill: "bg-gradient-to-r from-amber-500 to-orange-600",
        timeLabel: "text-slate-500 font-bold",
        timeValue: "text-slate-900 tracking-tighter",
        timeTrack: "bg-slate-200/50",
        timeFill: "bg-gradient-to-r from-amber-500 to-orange-600",
        answerBase:
            "relative overflow-hidden rounded-md border transition-all duration-200 ease-out px-4 py-4 text-sm sm:text-base font-bold tracking-tight shadow-sm active:scale-[0.98]",
        answerIdle:
            "border-border/70 bg-card text-slate-700 hover:border-amber-400/50 hover:bg-muted/40",
        answerSelected:
            "border-amber-500 bg-amber-500 text-white shadow-sm",
        answerDisabled: "cursor-not-allowed opacity-60",
        answerCorrect:
            "border-emerald-500 bg-emerald-500 text-white shadow-sm",
        answerIncorrect:
            "border-rose-500 bg-rose-500 text-white shadow-sm",
        imageFrame:
            "rounded-md border border-border/60 bg-card shadow-inner",
        nextButton:
            "rounded-sm bg-slate-900 text-white shadow-sm hover:bg-slate-800",
        nextDisabled: "bg-slate-200 text-slate-400 cursor-not-allowed",
    },
    dark: {
        wrapper:
            "bg-background text-foreground ring-1 ring-border shadow-sm",
        // More localized, intense glows for 'Pro Max' dark feel
        overlayA: "bg-emerald-500/10 blur-[100px]",
        overlayB: "bg-indigo-500/10 blur-[100px]",
        overlayC: "bg-rose-500/10 blur-[100px]",
        card:
            "bg-card text-card-foreground shadow-sm ring-1 ring-border",
        helper: "text-white/40 font-bold",
        question: "text-white tracking-tight drop-shadow-sm",
        progressTrack: "bg-white/5",
        progressFill: "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.4)]",
        timeLabel: "text-white/40 font-bold",
        timeValue: "text-white tracking-tighter",
        timeTrack: "bg-white/5",
        // Dynamic timer color is handled in logic, this is base
        timeFill: "bg-white",
        answerBase:
            "relative overflow-hidden rounded-md border transition-all duration-200 ease-out px-4 py-4 text-sm sm:text-base font-bold tracking-tight active:scale-[0.98]",
        answerIdle:
            "border-border bg-card text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white",
        answerSelected:
            "border-white bg-white text-black shadow-sm",
        answerDisabled: "cursor-not-allowed opacity-40",
        answerCorrect:
            "border-emerald-400 bg-emerald-500 text-black shadow-sm",
        answerIncorrect:
            "border-rose-400 bg-rose-500 text-white shadow-sm",
        imageFrame:
            "rounded-md border border-border/70 bg-card shadow-sm",
        nextButton:
            "rounded-sm bg-white text-black shadow-sm hover:bg-white/90",
        nextDisabled: "bg-white/10 text-white/20 cursor-not-allowed",
    },
};
