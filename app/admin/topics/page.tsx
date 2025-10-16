"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
  parentId?: string;
  parent?: { name: string };
  children?: Topic[];
  _count: {
    questions: number;
    children: number;
    quizTopicConfigs: number;
  };
}

export default function TopicsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/topics?includeChildren=true");
      const result = await response.json();

      if (response.ok) {
        setTopics(result.data.topics);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load topics",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  const toggleExpand = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!topicToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/topics/${topicToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.data?.message?.includes("successfully")) {
        // Show the reason why it can't be deleted
        toast({
          title: "Cannot Delete Topic",
          description: result.data?.message || result.error || "Failed to delete topic",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Topic deleted!",
          description: "The topic has been removed successfully.",
        });
        loadTopics();
      }

      setDeleteDialogOpen(false);
      setTopicToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (topic: Topic) => {
    setTopicToDelete(topic);
    setDeleteDialogOpen(true);
  };

  const renderTopicRow = (topic: Topic, depth: number = 0) => {
    const hasChildren = topic._count.children > 0;
    const isExpanded = expandedTopics.has(topic.id);

    return (
      <Fragment key={topic.id}>
        <TableRow>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpand(topic.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}
              <span className="font-medium">{topic.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <code className="text-xs bg-muted px-2 py-1 rounded">{topic.slug}</code>
          </TableCell>
          <TableCell>
            {topic.parent ? (
              <Badge variant="outline">{topic.parent.name}</Badge>
            ) : (
              <Badge>Root</Badge>
            )}
          </TableCell>
          <TableCell className="text-center">
            <Badge variant="secondary">{topic.level}</Badge>
          </TableCell>
          <TableCell className="text-right">{topic._count.questions}</TableCell>
          <TableCell className="text-right">{topic._count.children}</TableCell>
          <TableCell className="text-right">{topic._count.quizTopicConfigs}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Link href={`/admin/topics/${topic.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDeleteDialog(topic)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && topic.children?.map((child) => renderTopicRow(child, depth + 1))}
      </Fragment>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Topics"
        description="Manage topic hierarchy for categorizing questions"
        action={
          <Link href="/admin/topics/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Topic
            </Button>
          </Link>
        }
      />

      <div className="mb-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Topics are organized in a tree hierarchy. Click the arrows to expand/collapse sub-topics.
          Child topics automatically include parent topic when filtering.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="text-center">Level</TableHead>
              <TableHead className="text-right">Questions</TableHead>
              <TableHead className="text-right">Sub-topics</TableHead>
              <TableHead className="text-right">Used in Quizzes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.map((topic) => renderTopicRow(topic))}
            {topics.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    No topics found. Create your first topic to get started.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{topicToDelete?.name}&quot;?
              
              {topicToDelete && (
                <div className="mt-4 space-y-2">
                  {topicToDelete._count.questions > 0 && (
                    <div className="text-destructive font-medium">
                      ⚠️ This topic has {topicToDelete._count.questions} question(s)
                    </div>
                  )}
                  {topicToDelete._count.children > 0 && (
                    <div className="text-destructive font-medium">
                      ⚠️ This topic has {topicToDelete._count.children} sub-topic(s)
                    </div>
                  )}
                  {topicToDelete._count.quizTopicConfigs > 0 && (
                    <div className="text-destructive font-medium">
                      ⚠️ This topic is used in {topicToDelete._count.quizTopicConfigs} quiz configuration(s)
                    </div>
                  )}
                  {(topicToDelete._count.questions > 0 || 
                    topicToDelete._count.children > 0 || 
                    topicToDelete._count.quizTopicConfigs > 0) && (
                    <p className="text-sm mt-2">
                      You must remove/reassign all dependencies before deleting this topic.
                    </p>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                deleting ||
                Boolean(topicToDelete && (
                  topicToDelete._count.questions > 0 ||
                  topicToDelete._count.children > 0 ||
                  topicToDelete._count.quizTopicConfigs > 0
                ))
              }
            >
              {deleting ? "Deleting..." : "Delete Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
