"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const iconComponents = {
  LayoutDashboard,
  FileQuestion,
  HelpCircle,
  Users,
  Upload,
  Settings,
  FolderTree,
};

interface NavigationItem {
  name: string;
  href: string;
  icon: keyof typeof iconComponents;
}

interface AdminShellProps {
  navigation: NavigationItem[];
  children: React.ReactNode;
}

export function AdminShell({ navigation, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavigation = (className?: string) =>
    navigation.map((item) => {
      const Icon = iconComponents[item.icon] ?? LayoutDashboard;
      const active = isActive(item.href);
      return (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            className
          )}
          onClick={() => setMobileOpen(false)}
        >
          <Icon className="h-5 w-5" />
          {item.name}
        </Link>
      );
    });

  const handleSignOut = () => {
    void signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin" className="text-lg font-semibold">
            Sports Trivia Admin
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileOpen && <div className="space-y-1 px-4 pb-4">{renderNavigation()}</div>}
      </div>

      <div className="flex h-screen overflow-hidden">
        <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-card lg:flex">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/admin" className="text-xl font-bold">
              Sports Trivia Admin
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">{renderNavigation()}</nav>
          <div className="border-t p-4 space-y-2">
            <Link href="/" className="flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground">
              View Site
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 hidden border-b bg-background px-6 py-4 lg:flex items-center justify-end gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
              View Site
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </header>
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
