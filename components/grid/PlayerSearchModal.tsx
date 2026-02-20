
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface PlayerSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (answer: string) => Promise<void>;
    rowLabel: string;
    colLabel: string;
}

export function PlayerSearchModal({
    isOpen,
    onClose,
    onSubmit,
    rowLabel,
    colLabel
}: PlayerSearchModalProps) {
    const [answer, setAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setAnswer("");
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(answer);
            onClose();
        } catch (error) {
            console.error("Failed to submit answer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md top-[20%] translate-y-0 sm:top-[50%] sm:-translate-y-1/2">
                <DialogHeader>
                    <DialogTitle>Make your pick</DialogTitle>
                    <DialogDescription>
                        Who played for both teams?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-dashed">
                                <span className="font-bold text-primary">{rowLabel}</span>
                                <span className="text-xs">&times;</span>
                                <span className="font-bold text-primary">{colLabel}</span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Type player name..."
                                    className="pl-9 h-12 text-lg"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    autoFocus
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!answer.trim() || isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Lock In Answer
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
