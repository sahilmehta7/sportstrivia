"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar, 
  Target, 
  List,
  ImageIcon,
  FileText,
  Zap,
  Award,
  Star,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const showcaseComponents = [
  {
    id: "ui-playground",
    title: "UI Playground",
    description: "Preview the reusable showcase components in light and dark themes",
    icon: Sparkles,
    category: "UI Components",
    featured: true,
  },
  {
    id: "featured-quiz-card",
    title: "Featured Quiz Card",
    description: "Premium quiz card design for featured content",
    icon: Star,
    category: "Quiz Cards",
  },
  {
    id: "hero-variants",
    title: "Hero Variations",
    description: "Spotlight, split, banner, and deck hero layouts",
    icon: Megaphone,
    category: "UI Components",
    featured: true,
  },
  {
    id: "quiz-card",
    title: "Quiz Card",
    description: "Standard quiz card component",
    icon: Target,
    category: "Quiz Cards",
  },
  {
    id: "quiz-card-2",
    title: "Quiz Card Variant 2",
    description: "Alternative quiz card design",
    icon: Target,
    category: "Quiz Cards",
  },
  {
    id: "quiz-listing",
    title: "Quiz Listing",
    description: "Grid layout for displaying multiple quizzes",
    icon: List,
    category: "Layouts",
  },
  {
    id: "quiz-carousel",
    title: "Quiz Carousel",
    description: "Horizontal scrolling quiz showcase",
    icon: ImageIcon,
    category: "Interactive",
  },
  {
    id: "quiz-detail",
    title: "Quiz Detail Page",
    description: "Comprehensive quiz information and start page",
    icon: FileText,
    category: "Pages",
  },
  {
    id: "quiz-journey",
    title: "Quiz Journey",
    description: "Interactive quiz taking experience",
    icon: Zap,
    category: "Experience",
  },
  {
    id: "quiz-results",
    title: "Quiz Results",
    description: "Results display after completing a quiz",
    icon: Trophy,
    category: "Results",
  },
  {
    id: "quiz-experience",
    title: "Quiz Experience",
    description: "Full quiz flow and interactions",
    icon: Award,
    category: "Experience",
  },
  {
    id: "top-topics",
    title: "Top Topics",
    description: "Display popular quiz topics",
    icon: TrendingUp,
    category: "Topics",
  },
  {
    id: "topic-cards",
    title: "Topic Cards",
    description: "Card layout for topic browsing",
    icon: FileText,
    category: "Topics",
  },
  {
    id: "leaderboard",
    title: "Leaderboard",
    description: "Competition rankings and scores",
    icon: Users,
    category: "Competition",
  },
  {
    id: "daily-streak",
    title: "Daily Streak",
    description: "User engagement and streak tracking",
    icon: Calendar,
    category: "Engagement",
  },
];

const categories = ["All Sports", "UI Components", "Quiz Cards", "Layouts", "Interactive", "Pages", "Experience", "Results", "Topics", "Competition", "Engagement"];

export default function ShowcaseIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Sports");

  const filteredComponents = selectedCategory === "All Sports"
    ? showcaseComponents
    : showcaseComponents.filter((c) => c.category === selectedCategory);

  const featuredComponents = filteredComponents.filter((c) => c.featured);
  const regularComponents = filteredComponents.filter((c) => !c.featured);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <span>/</span>
            <span>Showcase</span>
          </nav>
        </div>
        
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge className="mb-4" variant="outline">
            Showcase
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            UI Components & Design System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of reusable UI components, layouts, and design patterns built for sports trivia.
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "whitespace-nowrap",
                  selectedCategory === category && "bg-primary text-primary-foreground"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Component */}
        {featuredComponents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Featured</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredComponents.map((component) => (
                <FeaturedCard key={component.id} component={component} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Components */}
        {regularComponents.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {selectedCategory === "All Sports" ? "All Components" : selectedCategory}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularComponents.map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </div>
        )}

        {filteredComponents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No components found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedCard({ component }: { component: typeof showcaseComponents[0] }) {
  const Icon = component.icon;
  
  return (
    <Link href={`/showcase/${component.id}`} className="group">
      <Card className="h-full transition-all hover:shadow-lg hover:scale-105 border-2">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs">
              Featured
            </Badge>
          </div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {component.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {component.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            View Showcase
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ComponentCard({ component }: { component: typeof showcaseComponents[0] }) {
  const Icon = component.icon;
  
  return (
    <Link href={`/showcase/${component.id}`} className="group">
      <Card className="h-full transition-all hover:shadow-lg hover:scale-105">
        <CardHeader>
          <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">
            {component.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {component.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
