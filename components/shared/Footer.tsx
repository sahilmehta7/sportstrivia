import Link from "next/link";
import { Twitter, Facebook, Youtube, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Brand Section */}
          <div className="space-y-12">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3 group">
                <ShieldCheck className="h-8 w-8 text-accent" />
                <span className="text-4xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]">
                  TRIVIA<span className="text-accent">PRO</span>
                </span>
              </Link>
              <p className="max-w-md text-xl font-medium text-background/60 leading-tight uppercase tracking-tight">
                THE ULTIMATE ARENA FOR SPORT FANATICS. PROVEN PERFORMANCE. MAXIMUM IQ.
              </p>
            </div>

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
                  className="flex h-12 w-12 items-center justify-center border-2 border-background/10 hover:border-accent hover:text-accent transition-all duration-300"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            {[
              {
                heading: "Playbook",
                links: [
                  { label: "All Quizzes", href: "/quizzes" },
                  { label: "Live Rankings", href: "/leaderboard" },
                  { label: "Pro Challenges", href: "/challenges" },
                ],
              },
              {
                heading: "Intelligence",
                links: [
                  { label: "Topic Index", href: "/topics" },
                  { label: "Global Search", href: "/search" },
                  { label: "Arena Stats", href: "/profile/me" },
                ],
              },
              {
                heading: "Corporate",
                links: [
                  { label: "Privacy Policy", href: "/" },
                  { label: "Terms of Usage", href: "/" },
                  { label: "Contact Support", href: "/" },
                ],
              },
            ].map((column) => (
              <div key={column.heading} className="space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
                  {column.heading}
                </h4>
                <ul className="space-y-4">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <Link href={link.href} className="flex items-center gap-2 group text-sm font-bold uppercase tracking-widest text-background/40 transition-colors hover:text-background">
                        <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-background/30">
            © {currentYear} SPORTS TRIVIA COLLECTIVE. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Arena Servers Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
