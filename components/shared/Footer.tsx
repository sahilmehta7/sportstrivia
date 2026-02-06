import Link from "next/link";
import { Twitter, Facebook, Youtube, ShieldCheck, ArrowRight } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-background border-t border-accent/20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-8">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <ShieldCheck className="h-8 w-8 text-accent group-hover:scale-110 transition-transform duration-300" />
              <span className="text-3xl font-black italic tracking-tighter uppercase font-['Barlow_Condensed',sans-serif] text-foreground">
                SPORTS<span className="text-accent">TRIVIA</span>
              </span>
            </Link>
            <p className="text-sm font-medium text-foreground/60 uppercase tracking-widest leading-relaxed max-w-xs">
              The ultimate arena for sports fanatics. Prove your knowledge. Claim your glory.
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
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center border border-white/10 hover:border-accent hover:bg-accent/10 hover:text-accent text-foreground/60 transition-all duration-300"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                heading: "Competition",
                links: [
                  { label: "Leaderboard", href: "/leaderboard" },
                  { label: "Challenges", href: "/challenges" },
                  { label: "Quizzes", href: "/quizzes" },
                ],
              },
              {
                heading: "Discover",
                links: [
                  { label: "Topic Index", href: "/topics" },
                  { label: "Global Search", href: "/search" },
                  { label: "My Profile", href: "/profile/me" },
                ],
              },
              {
                heading: "Company",
                links: [
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Usage", href: "/terms" },
                  { label: "Contact Support", href: "mailto:support@sportstrivia.in" },
                ],
              },
            ].map((column) => (
              <div key={column.heading} className="space-y-6">
                <h4 className="text-sm font-black uppercase italic tracking-widest text-accent border-l-2 border-accent pl-3">
                  {column.heading}
                </h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground/50 hover:text-accent transition-colors duration-300"
                      >
                        <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-accent" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30">
          <div>
            © {currentYear} SPORTS TRIVIA COLLECTIVE.
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-accent animate-pulse" />
            <span>Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
