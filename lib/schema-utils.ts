/**
 * Schema.org structured data utility functions
 * Generates JSON-LD markup for SEO and rich snippets
 */
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";
import { BASE_URL, getCanonicalUrl } from "@/lib/next-seo-config";

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
  sportUrl?: string | null;
  difficulty: string;
  duration?: number | null;
  passingScore: number;
  descriptionImageUrl?: string | null;
  averageRating: number;
  totalReviews: number;
  createdAt: Date | string | number;
  updatedAt: Date | string | number;
  topicConfigs?: Array<{
    topic: {
      name: string;
      slug?: string;
    };
  }>;
}) {
  const quizUrl = `${BASE_URL}/quizzes/${quiz.slug}`;
  const topics = quiz.topicConfigs?.map(config => config.topic) || [];
  const datePublished = toIsoDateString(quiz.createdAt);
  const dateModified = toIsoDateString(quiz.updatedAt);
  const sportName = quiz.sport?.trim() || "Sports";
  
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "@id": quizUrl,
    name: quiz.title,
    description: quiz.description || `Test your knowledge about ${quiz.sport || "sports"} with this ${quiz.difficulty.toLowerCase()} difficulty quiz`,
    url: quizUrl,
    ...(quiz.descriptionImageUrl ? { image: quiz.descriptionImageUrl } : {}),
    about: {
      "@type": "Thing",
      name: sportName,
      ...(quiz.sportUrl ? { url: quiz.sportUrl } : {}),
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
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
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
    ...(topic.parentId
      ? {
          isPartOf: {
            "@type": "CollectionPage",
            name: "Sports Topics",
          },
        }
      : {}),
  };
}

type TopicSchemaEntityData = Record<string, unknown>;

type TopicSchemaGraphInput = {
  topic: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
    schemaType: TopicSchemaTypeValue;
    schemaCanonicalUrl?: string | null;
    schemaSameAs?: string[] | null;
    schemaEntityData?: TopicSchemaEntityData | null;
    parent?: {
      name: string;
      slug: string;
      schemaType?: TopicSchemaTypeValue | null;
      schemaCanonicalUrl?: string | null;
      schemaSameAs?: string[] | null;
    } | null;
  };
  quizUrls: string[];
};

function topicUrl(slug: string): string {
  return `${BASE_URL}/topics/${slug}`;
}

function topicCollectionId(slug: string): string {
  return `${topicUrl(slug)}#collection`;
}

function topicEntityId(slug: string): string {
  return `${topicUrl(slug)}#entity`;
}

function uniqueUrls(values: string[] | null | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

function asIsoDate(value: unknown): string | undefined {
  return toIsoDateString(value as string | number | Date | null | undefined);
}

function toIsoDateString(value: Date | string | number | null | undefined): string | undefined {
  if (value == null) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function getTopicCollectionSchema(
  topic: {
    name: string;
    slug: string;
    description?: string | null;
    parentSlug?: string;
  },
  options: {
    quizCount?: number;
    quizUrls?: string[];
    mainEntityId?: string;
  } = {}
) {
  const topicUrl = `${BASE_URL}/topics/${topic.slug}`;
  const collectionId = `${topicUrl}#collection`;
  const parentCollectionId = topic.parentSlug ? `${BASE_URL}/topics/${topic.parentSlug}#collection` : undefined;
  const hasPart = (options.quizUrls ?? []).slice(0, 10).map((url) => ({ "@id": url }));
  
  return {
    "@type": "CollectionPage",
    "@id": collectionId,
    name: topic.name,
    description: topic.description || `Explore quizzes about ${topic.name}`,
    url: topicUrl,
    ...(options.mainEntityId
      ? {
          mainEntity: { "@id": options.mainEntityId },
          about: { "@id": options.mainEntityId },
        }
      : {
          about: {
            "@type": "Thing",
            name: topic.name,
          },
        }),
    ...(typeof options.quizCount === "number" ? { numberOfItems: options.quizCount } : {}),
    ...(parentCollectionId ? { isPartOf: { "@id": parentCollectionId } } : {}),
    ...(hasPart.length > 0 ? { hasPart } : {}),
  };
}

export function getTopicPrimaryEntitySchema(input: TopicSchemaGraphInput["topic"]) {
  const schemaType = input.schemaType;
  const canonicalUrl = asNonEmptyString(input.schemaCanonicalUrl);
  const url = topicUrl(input.slug);
  const entityId = topicEntityId(input.slug);
  const collectionId = topicCollectionId(input.slug);

  if (schemaType === "NONE") {
    return null;
  }

  const sameAs = uniqueUrls(input.schemaSameAs);
  const data = (input.schemaEntityData ?? {}) as TopicSchemaEntityData;
  const sportName = asNonEmptyString(data.sportName);

  const baseEntity = {
    "@id": entityId,
    name: input.name,
    url: canonicalUrl || url,
    ...(input.description ? { description: input.description } : {}),
    ...(sameAs.length > 0 ? { sameAs } : canonicalUrl ? { sameAs: [canonicalUrl] } : {}),
    mainEntityOfPage: { "@id": collectionId },
    subjectOf: { "@id": url },
  };

  if (schemaType === "SPORT") {
    const aliases = asStringArray(data.aliases);
    const broader =
      input.parent && input.parent.schemaType && input.parent.schemaType !== "NONE"
        ? { "@id": topicEntityId(input.parent.slug) }
        : undefined;

    return {
      "@type": "DefinedTerm",
      inDefinedTermSet: { "@id": `${BASE_URL}/topics#taxonomy` },
      ...(aliases.length > 0 ? { alternateName: aliases } : {}),
      ...(broader ? { broader } : {}),
      ...baseEntity,
    };
  }

  if (schemaType === "SPORTS_TEAM") {
    return {
      "@type": "SportsTeam",
      ...(sportName ? { sport: sportName } : {}),
      ...(asNonEmptyString(data.leagueName)
        ? {
            memberOf: {
              "@type": "SportsOrganization",
              name: asNonEmptyString(data.leagueName),
              ...(asNonEmptyString(data.leagueUrl) ? { url: asNonEmptyString(data.leagueUrl) } : {}),
            },
          }
        : {}),
      ...(asNonEmptyString(data.organizationName)
        ? {
            parentOrganization: {
              "@type": "SportsOrganization",
              name: asNonEmptyString(data.organizationName),
              ...(asNonEmptyString(data.organizationUrl) ? { url: asNonEmptyString(data.organizationUrl) } : {}),
            },
          }
        : {}),
      ...baseEntity,
    };
  }

  if (schemaType === "ATHLETE") {
    return {
      "@type": "Person",
      jobTitle: "Athlete",
      ...(asNonEmptyString(data.nationality) ? { nationality: asNonEmptyString(data.nationality) } : {}),
      ...(asIsoDate(data.birthDate) ? { birthDate: asIsoDate(data.birthDate) } : {}),
      ...(sportName ? { knowsAbout: [sportName] } : {}),
      ...(asNonEmptyString(data.teamName)
        ? {
            affiliation: {
              "@type": "SportsTeam",
              name: asNonEmptyString(data.teamName),
            },
          }
        : {}),
      ...baseEntity,
    };
  }

  if (schemaType === "SPORTS_ORGANIZATION") {
    return {
      "@type": "SportsOrganization",
      ...(sportName ? { sport: sportName } : {}),
      ...baseEntity,
    };
  }

  if (schemaType === "SPORTS_EVENT") {
    return {
      "@type": "SportsEvent",
      ...(sportName ? { sport: sportName } : {}),
      ...(asIsoDate(data.startDate) ? { startDate: asIsoDate(data.startDate) } : {}),
      ...(asIsoDate(data.endDate) ? { endDate: asIsoDate(data.endDate) } : {}),
      ...(asNonEmptyString(data.locationName)
        ? {
            location: {
              "@type": "Place",
              name: asNonEmptyString(data.locationName),
              ...(asNonEmptyString(data.locationUrl) ? { url: asNonEmptyString(data.locationUrl) } : {}),
            },
          }
        : {}),
      ...(asNonEmptyString(data.organizerName)
        ? {
            organizer: {
              "@type": "SportsOrganization",
              name: asNonEmptyString(data.organizerName),
              ...(asNonEmptyString(data.organizerUrl) ? { url: asNonEmptyString(data.organizerUrl) } : {}),
            },
          }
        : {}),
      ...baseEntity,
    };
  }

  return null;
}

export function getTopicGraphSchema(input: TopicSchemaGraphInput) {
  const primaryEntity = getTopicPrimaryEntitySchema(input.topic);
  const collection = getTopicCollectionSchema(
    {
      name: input.topic.name,
      slug: input.topic.slug,
      description: input.topic.description,
      parentSlug: input.topic.parent?.slug,
    },
    {
      quizUrls: input.quizUrls,
      mainEntityId: primaryEntity ? topicEntityId(input.topic.slug) : undefined,
    }
  );

  return {
    "@context": "https://schema.org",
    "@graph": [collection, ...(primaryEntity ? [primaryEntity] : [])],
  };
}

/**
 * Combined Topic Page Graph Schema
 * Aggregates Breadcrumbs, CollectionPage, Primary Entity, and ItemList
 */
export function getTopicPageGraphSchema(input: Omit<TopicSchemaGraphInput, "quizUrls"> & {
  breadcrumbs: Array<{ name: string; url?: string }>;
  quizzes: Array<{ title: string; slug: string; description?: string | null; descriptionImageUrl?: string | null }>;
  faqs?: Array<{ question: string; answer: string }> | null;
}) {
  const primaryEntity = getTopicPrimaryEntitySchema(input.topic);
  const collection = getTopicCollectionSchema(
    {
      name: input.topic.name,
      slug: input.topic.slug,
      description: input.topic.description,
      parentSlug: input.topic.parent?.slug,
    },
    {
      quizCount: input.quizzes.length,
      quizUrls: input.quizzes.map(q => getCanonicalUrl(`/quizzes/${q.slug}`)),
      mainEntityId: primaryEntity ? topicEntityId(input.topic.slug) : undefined,
    }
  );

  const itemList = getItemListSchema(
    input.quizzes.map((q, index) => ({
      id: `quiz-${index}`,
      title: q.title,
      slug: q.slug,
      description: q.description,
      descriptionImageUrl: q.descriptionImageUrl,
    })),
    `${input.topic.name} Quizzes`,
    false
  );

  const breadcrumbs = getBreadcrumbSchema(input.breadcrumbs, false);

  // We need to fix the itemList to use the provided URLs correctly
  // Instead of re-parsing URLs, let's use a better approach if possible, 
  // but for now, we'll keep it simple or update the interface.
  // Actually, TopicDetailPage passes quiz objects to ItemListStructuredData.
  // Let's add a more flexible type or another helper.

  const graph: any[] = [
    breadcrumbs,
    collection,
    itemList,
    ...(primaryEntity ? [primaryEntity] : []),
  ];

  if (input.faqs && input.faqs.length > 0) {
    graph.push(getFAQSchema(input.faqs, false));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/**
 * Breadcrumb Schema
 */
export function getBreadcrumbSchema(items: Array<{
  name: string;
  url?: string;
}>, includeContext = true) {
  return {
    ...(includeContext ? { "@context": "https://schema.org" } : {}),
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: getCanonicalUrl(item.url) } : {}),
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
  createdAt: Date | string | number;
  user: {
    name?: string | null;
    image?: string | null;
  };
}, quizTitle: string) {
  const datePublished = toIsoDateString(review.createdAt);

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
    ...(datePublished ? { datePublished } : {}),
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
}>, includeContext = true) {
  return {
    ...(includeContext ? { "@context": "https://schema.org" } : {}),
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
}>, listName: string = "Sports Trivia Quizzes", includeContext = true) {
  return {
    ...(includeContext ? { "@context": "https://schema.org" } : {}),
    "@type": "ItemList",
    name: listName,
    itemListElement: quizzes.map((quiz, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getCanonicalUrl(`/quizzes/${quiz.slug}`),
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
