/**
 * Schema.org structured data utility functions
 * Generates JSON-LD markup for SEO and rich snippets
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sportstrivia.in";

/**
 * Organization Schema - Add to root layout
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sports Trivia Platform",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: "Test your sports knowledge with interactive trivia quizzes covering all major sports",
    sameAs: [
      // Add social media links when available
      // "https://twitter.com/sportstrivia",
      // "https://facebook.com/sportstrivia",
    ],
  };
}

/**
 * WebSite Schema with Search Action - Add to root layout
 */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sports Trivia Platform",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/quizzes?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Quiz Schema - Educational content with HowTo and Quiz combined
 */
export function getQuizSchema(quiz: {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  sport?: string | null;
  difficulty: string;
  duration?: number | null;
  passingScore: number;
  descriptionImageUrl?: string | null;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
  topicConfigs?: Array<{
    topic: {
      name: string;
      slug: string;
    };
  }>;
}) {
  const quizUrl = `${BASE_URL}/quizzes/${quiz.slug}`;
  const topics = quiz.topicConfigs?.map(config => config.topic) || [];
  
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "@id": quizUrl,
    name: quiz.title,
    description: quiz.description || `Test your knowledge about ${quiz.sport || "sports"} with this ${quiz.difficulty.toLowerCase()} difficulty quiz`,
    url: quizUrl,
    ...(quiz.descriptionImageUrl ? { image: quiz.descriptionImageUrl } : {}),
    about: topics.length > 0 ? topics.map(topic => ({
      "@type": "Thing",
      name: topic.name,
      url: `${BASE_URL}/topics/${topic.slug}`,
    })) : {
      "@type": "Thing",
      name: quiz.sport || "Sports",
    },
    educationalLevel: quiz.difficulty,
    typicalAgeRange: "13-",
    ...(quiz.duration ? { timeRequired: `PT${Math.ceil(quiz.duration / 60)}M` } : {}),
    hasPart: {
      "@type": "Question",
      eduQuestionType: "Multiple choice",
    },
    assesses: topics.length > 0 
      ? `Knowledge of ${topics.map(t => t.name).join(", ")}`
      : `Knowledge of ${quiz.sport || "sports"}`,
    datePublished: quiz.createdAt.toISOString(),
    dateModified: quiz.updatedAt.toISOString(),
    ...(quiz.totalReviews > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: quiz.averageRating.toFixed(1),
        reviewCount: quiz.totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    ...(topics.length > 0 ? {
      keywords: topics.map(t => t.name).join(", "),
    } : {}),
  };
}

/**
 * HowTo Schema for Quiz Instructions
 */
export function getQuizHowToSchema(quiz: {
  title: string;
  slug: string;
  passingScore: number;
  duration?: number | null;
  timePerQuestion?: number | null;
  negativeMarkingEnabled: boolean;
  penaltyPercentage: number;
  timeBonusEnabled: boolean;
  bonusPointsPerSecond: number;
  descriptionImageUrl?: string | null;
}) {
  const steps = [
    {
      "@type": "HowToStep",
      name: "Start the Quiz",
      text: `Click "Start Quiz" to begin. You'll need to answer at least ${quiz.passingScore}% correctly to pass.`,
      position: 1,
    },
  ];

  if (quiz.timePerQuestion) {
    steps.push({
      "@type": "HowToStep",
      name: "Answer Within Time Limit",
      text: `You have ${Math.ceil(quiz.timePerQuestion / 60)} minutes for each question. Answer before time runs out!`,
      position: 2,
    });
  }

  if (quiz.negativeMarkingEnabled) {
    steps.push({
      "@type": "HowToStep",
      name: "Watch Out for Penalties",
      text: `Wrong answers reduce your score by ${quiz.penaltyPercentage}% of the question value.`,
      position: steps.length + 1,
    });
  }

  if (quiz.timeBonusEnabled) {
    steps.push({
      "@type": "HowToStep",
      name: "Earn Time Bonuses",
      text: `Answer quickly to earn bonus points! You'll get ${quiz.bonusPointsPerSecond} points for each second you save.`,
      position: steps.length + 1,
    });
  }

  steps.push({
    "@type": "HowToStep",
    name: "Review and Improve",
    text: "Review your results, earn badges, and climb the leaderboard!",
    position: steps.length + 1,
  });

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Play ${quiz.title}`,
    description: `Step-by-step guide to completing ${quiz.title}`,
    ...(quiz.descriptionImageUrl ? { image: quiz.descriptionImageUrl } : {}),
    totalTime: quiz.duration ? `PT${Math.ceil(quiz.duration / 60)}M` : undefined,
    step: steps,
  };
}

/**
 * Topic Schema - CollectionPage with contained quizzes
 */
export function getTopicSchema(topic: {
  name: string;
  slug: string;
  description?: string | null;
  level: number;
  parentId?: string | null;
}, quizCount: number) {
  const topicUrl = `${BASE_URL}/topics/${topic.slug}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": topicUrl,
    name: topic.name,
    description: topic.description || `Explore quizzes about ${topic.name}`,
    url: topicUrl,
    about: {
      "@type": "Thing",
      name: topic.name,
    },
    numberOfItems: quizCount,
    ...(topic.parentId ? {
      isPartOf: {
        "@type": "CollectionPage",
        name: "Sports Topics",
      },
    } : {}),
  };
}

/**
 * Breadcrumb Schema
 */
export function getBreadcrumbSchema(items: Array<{
  name: string;
  url?: string;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: `${BASE_URL}${item.url}` } : {}),
    })),
  };
}

/**
 * Person Schema for User Profiles
 */
export function getPersonSchema(user: {
  name?: string | null;
  image?: string | null;
  bio?: string | null;
  id: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.name || "Anonymous User",
    ...(user.image ? { image: user.image } : {}),
    ...(user.bio ? { description: user.bio } : {}),
    identifier: user.id,
  };
}

/**
 * Review Schema for Quiz Reviews
 */
export function getReviewSchema(review: {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: Date;
  user: {
    name?: string | null;
    image?: string | null;
  };
}, quizTitle: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person",
      name: review.user.name || "Anonymous",
      ...(review.user.image ? { image: review.user.image } : {}),
    },
    ...(review.comment ? { reviewBody: review.comment } : {}),
    datePublished: review.createdAt.toISOString(),
    itemReviewed: {
      "@type": "Quiz",
      name: quizTitle,
    },
  };
}

/**
 * FAQPage Schema for common questions
 */
export function getFAQSchema(faqs: Array<{
  question: string;
  answer: string;
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * ItemList Schema for Quiz Lists
 */
export function getItemListSchema(quizzes: Array<{
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  descriptionImageUrl?: string | null;
}>, listName: string = "Sports Trivia Quizzes") {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    itemListElement: quizzes.map((quiz, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/quizzes/${quiz.slug}`,
      name: quiz.title,
      ...(quiz.descriptionImageUrl ? { image: quiz.descriptionImageUrl } : {}),
      ...(quiz.description ? { description: quiz.description } : {}),
    })),
  };
}

/**
 * Helper to stringify JSON-LD data safely
 */
export function stringifyJsonLd(data: object): string {
  return JSON.stringify(data);
}

