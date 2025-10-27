import type { Metadata } from "next";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { LandingPage } from "@/components/home/LandingPage";

export const metadata: Metadata = {
  title: "Home",
  description: "Test your sports knowledge with thousands of trivia questions. Compete with friends, climb leaderboards, and become a sports trivia champion.",
  keywords: ["sports trivia", "sports quiz", "trivia questions", "sports knowledge", "competitive gaming"],
  openGraph: {
    title: "Sports Trivia - Test Your Sports Knowledge",
    description: "Test your sports knowledge with thousands of trivia questions. Compete with friends, climb leaderboards, and become a sports trivia champion.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sports Trivia - Test Your Sports Knowledge",
    description: "Test your sports knowledge with thousands of trivia questions. Compete with friends, climb leaderboards, and become a sports trivia champion.",
  },
};

async function fetchFeaturedQuizzes() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/quizzes?featured=true&limit=6`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.success ? data.data.quizzes : [];
  } catch (error) {
    console.error('Error fetching featured quizzes:', error);
    return [];
  }
}

async function fetchTopTopics() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/topics/top?sortBy=users&limit=6`, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.topics || [];
  } catch (error) {
    console.error('Error fetching top topics:', error);
    return [];
  }
}

export default async function Home() {
  // Fetch data for the landing page
  const [featuredQuizzes, topTopics] = await Promise.all([
    fetchFeaturedQuizzes(),
    fetchTopTopics(),
  ]);

  // Mock stats for now - these could be fetched from database in the future
  const stats = {
    totalQuizzes: 150,
    activeUsers: 2500,
    questionsAnswered: 50000,
    averageRating: 4.7,
  };

  return (
    <ShowcaseThemeProvider>
      <LandingPage 
        featuredQuizzes={featuredQuizzes}
        topTopics={topTopics}
        stats={stats}
      />
    </ShowcaseThemeProvider>
  );
}

