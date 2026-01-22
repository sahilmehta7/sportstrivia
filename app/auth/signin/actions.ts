"use server";

import { signIn } from "@/lib/auth";

export async function signInWithGoogleAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string || "/quizzes";
  await signIn("google", { redirectTo: callbackUrl });
}

