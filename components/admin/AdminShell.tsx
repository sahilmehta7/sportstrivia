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
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setMobileOpen(false)}
        >
          <Icon className="h-5 w-5" />
          {item.name}
        </Link>
      );
    }

    return (
      <div key={item.name} className="space-y-1">
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium cursor-pointer",
            active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          onClick={() => setOpenGroups((s) => ({ ...s, [item.href]: !(s[item.href] ?? true) }))}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <Link href={item.href} onClick={() => setMobileOpen(false)}>{item.name}</Link>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-0" : "-rotate-90")} />
        </div>
        {open && (
          <div className="ml-8 space-y-1">
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderNavigation = () => navigation.map((item) => renderItem(item));

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
          <nav className="flex-1 space-y-2 px-3 py-4">{renderNavigation()}</nav>
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
