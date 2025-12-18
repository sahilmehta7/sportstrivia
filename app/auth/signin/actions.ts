"use server";

import { signIn } from "@/lib/auth";

export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/quizzes" });
}

