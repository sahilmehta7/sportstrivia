import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Please contact support.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication. Please try again.",
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error || "Default";
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Link href="/auth/signin">
              <Button className="w-full" size="lg">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" size="lg">
                Go Home
              </Button>
            </Link>
          </div>

          {error === "Configuration" && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">For Administrators:</p>
              <p className="text-muted-foreground">
                Please ensure your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are correctly set.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

