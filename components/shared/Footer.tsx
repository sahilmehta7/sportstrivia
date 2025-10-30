import Link from "next/link";
import { Twitter, Facebook, Youtube, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="px-4 pb-10 pt-6">
      <div
        className={cn(
          "relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border p-8 md:p-12",
          "bg-card/80 backdrop-blur-lg border-border shadow-lg"
        )}
      >
        {/* soft glow accents */}
        <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/15 blur-[160px]" />
        <div className="pointer-events-none absolute -bottom-28 -left-10 h-64 w-64 rounded-full bg-blue-400/15 blur-[160px]" />

        <div className="relative grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Brand + CTA */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/25 to-pink-500/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/80">
              <Sparkles className="h-3 w-3" /> Sports Trivia
            </div>
            <h3 className={cn("text-3xl font-black", glassText.h3.replace("text-foreground", ""))}>
              Ignite your next trivia night.
            </h3>
            <p className={cn("max-w-md", glassText.subtitle)}>
              Stay sharp with daily challenges, track your stats, and compete on the global leaderboard.
            </p>
            <Link
              href="/quizzes"
              className="inline-flex w-fit items-center justify-center rounded-full bg-gradient-to-r from-primary to-pink-500 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-16px_rgba(59,130,246,0.55)] transition hover:-translate-y-0.5"
            >
              Browse Quizzes
            </Link>

            <div className="flex gap-3 pt-2">
              {[{ icon: Twitter, href: "https://twitter.com/sportstriviain" }, { icon: Facebook, href: "https://facebook.com" }, { icon: Youtube, href: "https://youtube.com" }].map(({ icon: Icon, href }) => (
                <Link key={href} href={href} className="flex h-10 w-10 items-center justify-center rounded-full border bg-card/60 text-foreground transition hover:bg-card border-border">
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                heading: "Product",
                links: [
                  { label: "Daily Quizzes", href: "/quizzes" },
                  { label: "Leaderboard", href: "/leaderboard" },
                  { label: "Friends", href: "/friends" },
                ],
              },
              {
                heading: "Discover",
                links: [
                  { label: "Topics", href: "/topics" },
                  { label: "Showcase", href: "/showcase" },
                  { label: "Random Quiz", href: "/random-quiz" },
                ],
              },
              {
                heading: "Company",
                links: [
                  { label: "About", href: "/" },
                  { label: "Contact", href: "mailto:support@sportstrivia.com" },
                  { label: "Careers", href: "/" },
                ],
              },
            ].map((column) => (
              <div key={column.heading} className="space-y-4">
                <h4 className={cn("text-sm font-semibold uppercase tracking-[0.3em]", glassText.subtitle)}>
                  {column.heading}
                </h4>
                <ul className="space-y-2 text-sm">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}-${link.href}`}>
                      <Link href={link.href} className="transition hover:opacity-80 text-muted-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-10 h-px bg-border" />

        <div className="relative mt-6 flex flex-col gap-3 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} Sports Trivia. Crafted with fans, for fans.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="transition hover:opacity-80">
              Privacy
            </Link>
            <Link href="/" className="transition hover:opacity-80">
              Terms
            </Link>
            <Link href="/" className="transition hover:opacity-80">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
