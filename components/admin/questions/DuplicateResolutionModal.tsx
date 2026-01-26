"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getDuplicateGroups, resolveDuplicateGroup, type DuplicateGroup } from "@/app/actions/admin-questions"; // You'll need to export DuplicateGroup
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Check, Trash2, GitMerge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DuplicateResolutionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DuplicateResolutionModal({ open, onOpenChange }: DuplicateResolutionModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [groups, setGroups] = useState<DuplicateGroup[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        if (open) {
            loadDuplicates();
        } else {
            setGroups([]);
            setCurrentIndex(0);
        }
    }, [open]);

    const loadDuplicates = async () => {
        setIsLoading(true);
        try {
            const data = await getDuplicateGroups();
            setGroups(data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load duplicates.",
                variant: "destructive",
            });
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (keepId: string) => {
        setResolving(true);
        const currentGroup = groups[currentIndex];
        const removeIds = currentGroup.questions.filter(q => q.id !== keepId).map(q => q.id);

        try {
            const result = await resolveDuplicateGroup(keepId, removeIds);
            if (result.success) {
                toast({
                    title: "Resolved",
                    description: "Duplicates merged successfully.",
                });

                // Remove processed group
                setGroups(prev => prev.filter((_, i) => i !== currentIndex));
                // Index stays same (so next item moves into view), unless we were at end
                if (currentIndex >= groups.length - 1) {
                    setCurrentIndex(Math.max(0, groups.length - 2));
                }
            } else {
                toast({
                    title: "Failed",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to resolve duplicates.",
                variant: "destructive",
            });
        } finally {
            setResolving(false);
        }
    };

    const handleAutoResolve = async () => {
        // Automatically keep the oldest (first one usually, based on sort order in query)
        // Assuming groups[currentIndex].questions is sorted by createdAt or we sort it here
        const currentGroup = groups[currentIndex];
        const sorted = [...currentGroup.questions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const keepId = sorted[0].id; // Keep oldest
        await handleResolve(keepId);
    };

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Scanning for duplicates...</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (groups.length === 0) {
        // Can show brief success message before closing or just text
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cleanup Complete</DialogTitle>
                        <DialogDescription>No duplicates found in the database.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    const currentGroup = groups[currentIndex];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Resolve Duplicates ({groups.length} remaining)</span>
                        {currentGroup?.hasTopicConflict && (
                            <Badge variant="destructive" className="ml-2">Topic Conflict</Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Review duplicate questions and choose which one to keep.
                    </DialogDescription>
                </DialogHeader>

                {currentGroup && (
                    <div className="space-y-6">
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <h3 className="font-semibold mb-1">Question Text</h3>
                            <p className="text-lg">{currentGroup.text}</p>
                        </div>

                        <div className="grid gap-4">
                            {currentGroup.questions.map((q) => (
                                <div key={q.id} className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border transition-all",
                                    "hover:bg-muted/50"
                                )}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{q.topicName}</Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Created {new Date(q.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex gap-3">
                                            <span>{q.usageCount.userAnswers} answers</span>
                                            <span>{q.usageCount.quizPools} quizzes</span>
                                            <span className="font-mono text-[10px] opacity-50">{q.id}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleResolve(q.id)}
                                        disabled={resolving}
                                        variant={currentGroup.hasTopicConflict ? "default" : "secondary"}
                                        className="gap-2"
                                    >
                                        {resolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                        Keep This
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-between">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    {!currentGroup?.hasTopicConflict && (
                        <Button
                            variant="outline"
                            onClick={handleAutoResolve}
                            disabled={resolving}
                            className="text-muted-foreground"
                        >
                            Auto-resolve (Keep Oldest)
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
