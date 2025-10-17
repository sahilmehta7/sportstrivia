import React from "react";
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
    { name: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" as const },
    { name: "Quizzes", href: "/admin/quizzes", icon: "FileQuestion" as const },
    { name: "Questions", href: "/admin/questions", icon: "HelpCircle" as const },
    { name: "Topics", href: "/admin/topics", icon: "FolderTree" as const },
    { name: "Users", href: "/admin/users", icon: "Users" as const },
    { name: "AI Quiz Generator", href: "/admin/ai-quiz", icon: "Sparkles" as const },
    { name: "Import Quiz", href: "/admin/import", icon: "Upload" as const },
    { name: "Import Topics", href: "/admin/topics/import", icon: "FolderInput" as const },
    { name: "Settings", href: "/admin/settings", icon: "Settings" as const },
  ];

  return <AdminShell navigation={navigation}>{children}</AdminShell>;
}
