export type PointsCategory =
  | "quiz"
  | "answer"
  | "streak"
  | "time"
  | "badge"
  | "friend"
  | "challenge";

export type PointsVariant = "toast" | "modal" | "inline" | "badge";

export type PointsSize = "sm" | "md" | "lg";

export interface PointsBreakdown {
  label: string;
  points: number;
  icon?: string;
}

export interface PointsRewardProps {
  points: number;
  reason: string;
  variant: PointsVariant;
  size?: PointsSize;
  category: PointsCategory;
  breakdown?: PointsBreakdown[];
  onClose?: () => void;
  className?: string;
}

