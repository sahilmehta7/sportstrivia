export interface FeaturedQuizSummary {
  id: string;
  slug: string;
  title: string;
  duration?: number | null;
  isFeatured?: boolean | null;
  descriptionImageUrl?: string | null;
  _count?: {
    attempts?: number | null;
  } | null;
}

export interface TopicSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  userCount: number;
  quizCount: number;
}

