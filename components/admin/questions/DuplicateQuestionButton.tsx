"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyX, Loader2 } from "lucide-react";
import { findAndRemoveDuplicateQuestions } from "@/app/actions/admin-questions";
import { useToast } from "@/hooks/use-toast";
import { DuplicateResolutionModal } from "./DuplicateResolutionModal";

export function DuplicateQuestionButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    return (
        <>
            <Button
                variant="destructive"
                disabled={isLoading}
                onClick={() => setOpen(true)}
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <CopyX className="mr-2 h-4 w-4" />
                )}
                Dedup Questions
            </Button>

            <DuplicateResolutionModal
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}
