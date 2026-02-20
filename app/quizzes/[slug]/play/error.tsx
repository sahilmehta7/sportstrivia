"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-background px-4 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                </div>
                <h2 className="text-lg font-bold">Something went wrong!</h2>
                <p className="text-sm text-muted-foreground">
                    We couldn&apos;t load the quiz. This might be a temporary issue.
                </p>
                <Button onClick={() => reset()} variant="outline">
                    Try again
                </Button>
            </div>
        </div>
    );
}
