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
            "bg-gradient-to-br from-amber-50 via-orange-50/50 to-rose-50 text-slate-900 shadow-2xl ring-1 ring-slate-900/5",
        overlayA: "bg-amber-300/40 mix-blend-multiply filter blur-3xl",
        overlayB: "bg-orange-300/40 mix-blend-multiply filter blur-3xl",
        overlayC: "bg-rose-300/40 mix-blend-multiply filter blur-3xl",
        card:
            "bg-white/60 backdrop-blur-2xl text-slate-900 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] ring-1 ring-white/60",
        helper: "text-slate-500 font-bold",
        question: "text-slate-900 tracking-tight",
        progressTrack: "bg-slate-200/50",
        progressFill: "bg-gradient-to-r from-amber-500 to-orange-600",
        timeLabel: "text-slate-500 font-bold",
        timeValue: "text-slate-900 tracking-tighter",
        timeTrack: "bg-slate-200/50",
        timeFill: "bg-gradient-to-r from-amber-500 to-orange-600",
        answerBase:
            "relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ease-out px-4 py-4 text-sm sm:text-base font-bold tracking-tight shadow-sm active:scale-[0.98]",
        answerIdle:
            "border-transparent bg-white/50 text-slate-700 hover:border-amber-400/50 hover:bg-white/80",
        answerSelected:
            "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/20",
        answerDisabled: "cursor-not-allowed opacity-60",
        answerCorrect:
            "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
        answerIncorrect:
            "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20",
        imageFrame:
            "border-2 border-white/50 bg-white/40 shadow-inner rounded-3xl",
        nextButton:
            "bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0.5",
        nextDisabled: "bg-slate-200 text-slate-400 cursor-not-allowed",
    },
    dark: {
        wrapper:
            "bg-black text-white ring-1 ring-white/10",
        // More localized, intense glows for 'Pro Max' dark feel
        overlayA: "bg-emerald-500/10 blur-[100px]",
        overlayB: "bg-indigo-500/10 blur-[100px]",
        overlayC: "bg-rose-500/10 blur-[100px]",
        card:
            "bg-[#0A0A0A]/60 backdrop-blur-3xl text-white shadow-2xl ring-1 ring-white/10",
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
            "relative overflow-hidden rounded-2xl border lg:border-2 transition-all duration-200 ease-out px-4 py-4 text-sm sm:text-base font-bold tracking-tight active:scale-[0.98]",
        answerIdle:
            "border-white/5 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white",
        answerSelected:
            "border-transparent bg-white text-black shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]",
        answerDisabled: "cursor-not-allowed opacity-40",
        answerCorrect:
            "border-transparent bg-emerald-500 text-black shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]",
        answerIncorrect:
            "border-transparent bg-rose-500 text-white shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)]",
        imageFrame:
            "border border-white/10 bg-white/5 shadow-2xl rounded-3xl",
        nextButton:
            "bg-white text-black shadow-[0_0_30px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.5)] hover:-translate-y-0.5 active:translate-y-0.5",
        nextDisabled: "bg-white/10 text-white/20 cursor-not-allowed",
    },
};
