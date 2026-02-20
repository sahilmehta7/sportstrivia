
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface RarityBadgeProps {
    percentage: number;
    className?: string;
}

export function RarityBadge({ percentage, className }: RarityBadgeProps) {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let colorClass = "";
    let icon = null;

    if (percentage < 1) {
        // Diamond / Mythic
        colorClass = "bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 text-white border-none animate-pulse";
        icon = <Sparkles className="w-3 h-3 mr-1 fill-current" />;
    } else if (percentage < 5) {
        // Gold
        colorClass = "bg-amber-400 text-amber-950 hover:bg-amber-500 border-amber-500";
    } else if (percentage < 20) {
        // Silver
        colorClass = "bg-slate-300 text-slate-900 hover:bg-slate-400 border-slate-400";
    } else {
        // Bronze / Common
        colorClass = "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200";
        variant = "outline";
    }

    return (
        <Badge
            variant={variant}
            className={cn("font-mono text-xs px-1.5 py-0.5 whitespace-nowrap", colorClass, className)}
        >
            {icon}
            {percentage.toFixed(1)}%
        </Badge>
    );
}
