import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-helpers";
import Link from "next/link";
import {
  LayoutDashboard,
  FileQuestion,
  HelpCircle,
  Users,
  Upload,
  Settings,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    redirect("/auth/unauthorized");
  }

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Quizzes", href: "/admin/quizzes", icon: FileQuestion },
    { name: "Questions", href: "/admin/questions", icon: HelpCircle },
    { name: "Topics", href: "/admin/topics", icon: FolderTree },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Import", href: "/admin/import", icon: Upload },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-64 overflow-y-auto border-r bg-card lg:block">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/admin" className="text-xl font-bold">
                Sports Trivia Admin
              </Link>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-4">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  View Site
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

