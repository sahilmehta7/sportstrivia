"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyX, Loader2 } from "lucide-react";
import { findAndRemoveDuplicateQuestions } from "@/app/actions/admin-questions";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DuplicateQuestionButton() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCleanup = async () => {
        setIsLoading(true);
        try {
            const result = await findAndRemoveDuplicateQuestions();

            if (result.success) {
                if (result.totalFound === 0) {
                    toast({
                        title: "No duplicates found",
                        description: "Your question database is clean!",
                        variant: "default",
                    });
                } else {
                    toast({
                        title: "Cleanup Complete",
                        description: `Removed ${result.removed} duplicates. Skipped ${result.skipped} due to existing data.`,
                        variant: "default",
                        duration: 5000,
                    });
                }
            } else {
                toast({
                    title: "Cleanup Failed",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch (_error) {
            toast({
                title: "An error occurred",
                description: "Failed to communicate with the server.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <CopyX className="mr-2 h-4 w-4" />
                    )}
                    Dedup Questions
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Duplicate Questions?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will scan all questions and remove duplicates based on exact text matches.
                        <br /><br />
                        - The oldest version of each question will be kept.
                        <br />
                        - Questions with existing user answers or other dependencies will be skipped to preserve data integrity.
                        <br /><br />
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCleanup} className="bg-destructive hover:bg-destructive/90">
                        {isLoading ? "Cleaning..." : "Yes, Remove Duplicates"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
