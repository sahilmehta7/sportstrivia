import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-background to-muted">
      <div className="text-center max-w-3xl mx-auto space-y-8">
        <div className="flex justify-center mb-8">
          <div className="rounded-full bg-primary/10 p-6">
            <Trophy className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight">
          Sports Trivia Platform
        </h1>
        
        <p className="text-xl text-muted-foreground">
          Test your sports knowledge, compete with friends, and climb the leaderboards
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          {session ? (
            <>
              <Link href="/quizzes">
                <Button size="lg" className="min-w-[200px]">
                  Browse Quizzes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button size="lg" variant="outline" className="min-w-[200px]">
                  Admin Panel
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button size="lg" className="min-w-[200px]">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/api/quizzes">
                <Button size="lg" variant="outline" className="min-w-[200px]">
                  View API
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Backend API and Admin Panel Ready • User-facing pages coming soon
          </p>
        </div>
      </div>
    </main>
  );
}

