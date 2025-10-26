import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { LandingPage } from "@/components/home/LandingPage";

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
    return data.success ? data.data.topics : [];
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

