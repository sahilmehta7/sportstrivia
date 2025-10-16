import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProfileRedirectPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Redirect to "my profile" page
  redirect("/profile/me");
}

