"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  ExternalLink,
  LayoutDashboard,
  FileQuestion,
  HelpCircle,
  Users,
  Upload,
  Settings,
  FolderTree,
  FolderInput,
  Sparkles,
  History,
  Trophy,
  ListOrdered,
  Medal,
  ChevronDown,
  FileText,
  Wrench,
  Activity,
  ShieldCheck,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";

const iconComponents = {
  LayoutDashboard,
  FileQuestion,
  HelpCircle,
  Users,
  Upload,
  Settings,
  FolderTree,
  FolderInput,
  Sparkles,
  History,
  Trophy,
  ListOrdered,
  Medal,
  FileText,
  Wrench,
};

interface NavigationItem {
  name: string;
  href: string;
  icon: keyof typeof iconComponents;
  children?: NavigationItem[];
}

interface AdminShellProps {
  navigation: NavigationItem[];
  children: ReactNode;
}

export function AdminShell({ navigation, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const { circle1, circle2, circle3 } = getBlurCircles();

  const renderItem = (item: NavigationItem, depth = 0) => {
    const Icon = iconComponents[item.icon] ?? LayoutDashboard;
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const active = isActive(item.href);
    const open = openGroups[item.href] ?? true;

    if (!hasChildren) {
      return (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
            active
              ? "bg-primary text-primary-foreground shadow-neon-cyan shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]"
              : "text-muted-foreground hover:bg-white/5 hover:text-primary"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <Icon className="h-4 w-4" />
          {item.name}
        </Link>
      );
    }

    return (
      <div key={item.name} className="space-y-1">
        <div
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
            active ? "text-primary bg-white/5" : "text-muted-foreground hover:bg-white/5 hover:text-primary"
          )}
          onClick={() => setOpenGroups((s) => ({ ...s, [item.href]: !(s[item.href] ?? true) }))}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span className="cursor-pointer">{item.name}</span>
          </div>
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-300", open ? "rotate-0" : "-rotate-90")} />
        </div>
        <div className={cn(
          "overflow-hidden transition-all duration-300 ml-6 border-l border-white/5 space-y-1 pl-2",
          open ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0"
        )}>
          {item.children!.map((child) => renderItem(child, depth + 1))}
        </div>
      </div>
    );
  };

  const renderNavigation = () => navigation.map((item) => renderItem(item));

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <ShowcaseThemeProvider>
      <div className="relative min-h-screen bg-background overflow-hidden flex flex-col lg:flex-row">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className={cn("absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle1)} />
          <div className={cn("absolute -right-[10%] top-[20%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle2)} />
          <div className={cn("absolute left-[20%] -bottom-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle3)} />
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden relative z-50 glass border-b border-white/10 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-primary shadow-neon-cyan" />
            <span className="text-xl font-black uppercase tracking-tighter">COMMAND</span>
          </div>
          <Button variant="glass" size="icon" className="rounded-xl h-10 w-10 flex lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden absolute inset-0 z-40 pt-20 pb-10 px-4 bg-background/95 backdrop-blur-xl overflow-y-auto">
            <div className="space-y-4">{renderNavigation()}</div>
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <Link href="/" className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                SITE OVERVIEW <Globe className="h-4 w-4" />
              </Link>
              <Button variant="accent" className="w-full rounded-2xl h-12" onClick={handleSignOut}>
                TERMINATE SESSION
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col relative z-20 glass border-r border-white/10 shadow-2xl">
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
              <h1 className={cn("text-2xl font-bold uppercase tracking-tighter", getGradientText("editorial"))}>
                COMMAND
              </h1>
            </div>
            <p className="text-[8px] font-bold tracking-[0.4em] text-muted-foreground uppercase mt-2">ADMINISTRATOR INTERFACE</p>
          </div>

          <nav className="flex-1 space-y-1 p-6 overflow-y-auto">
            {renderNavigation()}
          </nav>

          <div className="p-6 border-t border-white/5 space-y-4">
            <Link href="/" className="group flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
              BROADCAST PREVIEW
              <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Button variant="glass" className="w-full rounded-2xl h-12 border-white/5 hover:border-red-500/20 hover:text-red-400 group" onClick={handleSignOut}>
              <LogOut className="mr-3 h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
              TERMINATE SESSION
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative z-10 flex flex-col">
          <header className="hidden lg:flex sticky top-0 z-30 glass-elevated border-b border-white/10 px-8 py-4 items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              <Activity className="h-3.5 w-3.5 text-primary" />
              SYSTEM OPERATIONAL
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                LIVE SITE <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-neon-cyan animate-pulse" />
                <span className="text-[10px] font-black tracking-widest text-emerald-500">AUTHORITY: ADMIN</span>
              </div>
            </div>
          </header>

          <div className="flex-1 p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>

          {/* Visual Decors */}
          <div className="fixed bottom-10 right-10 pointer-events-none opacity-[0.03]">
            <ShieldCheck className="h-64 w-64" />
          </div>
        </main>
      </div>
    </ShowcaseThemeProvider>
  );
}
