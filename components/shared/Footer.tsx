import Link from "next/link";
import { Twitter, Facebook, Youtube, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div
        className={cn(
          "relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl border",
          "glass-elevated border-primary/10 shadow-glass-lg",
          "px-6 py-10 sm:p-12"
        )}
      >
        {/* Background neon glow accents */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/5 blur-[120px]" />

        <div className="relative grid gap-12 lg:grid-cols-[1fr_auto]">
          {/* Brand Section */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Link href="/" className={cn("text-3xl font-black tracking-tighter", getGradientText("neon"))}>
                SPORTS TRIVIA
              </Link>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary/80">
                <Sparkles className="h-3 w-3" /> Ignite Knowledge
              </div>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-muted-foreground font-medium">
              The ultimate arena for sport fanatics. Build your legacy, climb the leaderboards, and prove you're the champion of sports trivia.
            </p>

            <div className="flex gap-4">
              {[
                { icon: Twitter, href: "https://twitter.com/sportstriviain", label: "Twitter" },
                { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                { icon: Youtube, href: "https://youtube.com", label: "YouTube" }
              ].map(({ icon: Icon, href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl glass border-border hover:border-primary/50 text-foreground transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:gap-x-16">
            {[
              {
                heading: "Play",
                links: [
                  { label: "Quizzes", href: "/quizzes" },
                  { label: "Rankings", href: "/leaderboard" },
                  { label: "Challenges", href: "/challenges" },
                ],
              },
              {
                heading: "Discover",
                links: [
                  { label: "Topics", href: "/topics" },
                  { label: "Search", href: "/search" },
                  { label: "Categories", href: "/topics" },
                ],
              },
              {
                heading: "Connect",
                links: [
                  { label: "Friends", href: "/friends" },
                  { label: "Profile", href: "/profile/me" },
                  { label: "Settings", href: "/profile/me" },
                ],
              },
            ].map((column) => (
              <div key={column.heading} className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/80">
                  {column.heading}
                </h4>
                <ul className="space-y-3 text-sm">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <Link href={link.href} className="transition-colors duration-200 hover:text-primary text-muted-foreground font-medium">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-12 mb-8 h-px bg-white/5" />

        <div className="relative flex flex-col gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} SPORTS TRIVIA. FOR THE FANS.</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Link href="/" className="transition-colors hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/" className="transition-colors hover:text-primary">
              Terms of Use
            </Link>
            <Link href="/" className="transition-colors hover:text-primary">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
