import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-helpers";
import { AdminShell } from "@/components/admin/AdminShell";

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
    { name: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    { name: "Quizzes", href: "/admin/quizzes", icon: "FileQuestion" },
    { name: "Questions", href: "/admin/questions", icon: "HelpCircle" },
    { name: "Topics", href: "/admin/topics", icon: "FolderTree" },
    { name: "Users", href: "/admin/users", icon: "Users" },
    { name: "Import", href: "/admin/import", icon: "Upload" },
    { name: "Settings", href: "/admin/settings", icon: "Settings" },
  ];

  return <AdminShell navigation={navigation}>{children}</AdminShell>;
}
