"use client";

import { Fragment, useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  GitMerge,
  Check,
  ChevronsUpDown,
  Search,
  Loader2,
  Wand2,
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AdminPaginationClient } from "@/components/admin/AdminPaginationClient";

interface TopicNode {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  level: number;
  schemaType?: string;
  schemaCanonicalUrl?: string | null;
  schemaSameAs?: string[];
  schemaEntityData?: unknown;
  parentId?: string | null;
  parent?: { id?: string; name: string } | null;
  children?: TopicNode[];
  _count: {
    questions: number;
    children: number;
    quizTopicConfigs: number;
  };
}

interface FlatTopicOption {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
}

interface AdminTopicsClientProps {
  topics: TopicNode[];
  allTopics: FlatTopicOption[];
  filters: {
    search: string;
    schema: string;
    level: string;
  };
  filterOptions: {
    levels: number[];
  };
  counts: {
    total: number;
    matched: number;
    directMatches: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalRoots: number;
    totalPages: number;
  };
}

function collectExpandableNodeIds(nodes: TopicNode[]): Set<string> {
  const ids = new Set<string>();

  const walk = (entries: TopicNode[]) => {
    for (const node of entries) {
      if ((node.children?.length ?? 0) > 0) {
        ids.add(node.id);
        walk(node.children ?? []);
      }
    }
  };

  walk(nodes);
  return ids;
}

export function AdminTopicsClient({
  topics,
  allTopics,
  filters,
  filterOptions,
  counts,
  pagination,
}: AdminTopicsClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<TopicNode | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [topicToMerge, setTopicToMerge] = useState<TopicNode | null>(null);
  const [destinationTopicId, setDestinationTopicId] = useState<string>("");
  const [merging, setMerging] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [search, setSearch] = useState(filters.search);
  const [schema, setSchema] = useState(filters.schema || "all");
  const [level, setLevel] = useState(filters.level || "all");

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.schema.length > 0 && filters.schema !== "all") ||
    Boolean(filters.level);
  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.page < pagination.totalPages;
  const startRoot = pagination.totalRoots === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endRoot = pagination.totalRoots === 0 ? 0 : startRoot + topics.length - 1;

  useEffect(() => {
    setSearch(filters.search);
    setSchema(filters.schema || "all");
    setLevel(filters.level || "all");
  }, [filters.level, filters.schema, filters.search]);

  useEffect(() => {
    if (hasActiveFilters) {
      setExpandedTopics(collectExpandableNodeIds(topics));
    }
  }, [hasActiveFilters, topics]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const topic of allTopics) {
      if (!topic.parentId) continue;
      const existing = map.get(topic.parentId) ?? [];
      existing.push(topic.id);
      map.set(topic.parentId, existing);
    }
    return map;
  }, [allTopics]);

  const getSchemaTypeLabel = (schemaType?: string) => {
    switch (schemaType) {
      case "SPORT":
        return "Sport";
      case "SPORTS_TEAM":
        return "Sports Team";
      case "ATHLETE":
        return "Athlete";
      case "SPORTS_ORGANIZATION":
        return "Sports Org";
      case "SPORTS_EVENT":
        return "Sports Event";
      case "NONE":
      default:
        return "None";
    }
  };

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

  const updateQueryFromFormState = () => {
    const params = new URLSearchParams(searchParams.toString());

    const normalizedSearch = search.trim();
    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    } else {
      params.delete("search");
    }

    if (schema && schema !== "all") {
      params.set("schema", schema);
    } else {
      params.delete("schema");
    }

    if (level && level !== "all") {
      params.set("level", level);
    } else {
      params.delete("level");
    }

    // Forward-compatible with potential server pagination.
    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQueryFromFormState();
  };

  const resetFilters = () => {
    setSearch("");
    setSchema("all");
    setLevel("all");
    router.push(pathname);
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
        router.refresh();
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

  const openDeleteDialog = (topic: TopicNode) => {
    setTopicToDelete(topic);
    setDeleteDialogOpen(true);
  };

  const openMergeDialog = (topic: TopicNode) => {
    setTopicToMerge(topic);
    setDestinationTopicId("");
    setComboboxOpen(false);
    setMergeDialogOpen(true);
  };

  const handleMerge = async () => {
    if (!topicToMerge || !destinationTopicId) return;

    setMerging(true);
    try {
      const response = await fetch(`/api/admin/topics/${topicToMerge.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationId: destinationTopicId }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Merge Failed",
          description: result.error || "Failed to merge topics",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Topics Merged!",
          description: "Resources have been moved and the source topic was deleted.",
        });
        setMergeDialogOpen(false);
        setTopicToMerge(null);
        router.refresh();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMerging(false);
    }
  };

  const getMergeableTopics = (sourceTopicId: string): FlatTopicOption[] => {
    const excludedIds = new Set<string>([sourceTopicId]);
    const queue = [sourceTopicId];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      const childIds = childrenByParent.get(current) ?? [];
      for (const childId of childIds) {
        if (!excludedIds.has(childId)) {
          excludedIds.add(childId);
          queue.push(childId);
        }
      }
    }

    return allTopics.filter((topic) => !excludedIds.has(topic.id));
  };

  const handleBulkWikipediaAutofill = async () => {
    const shouldProceed = window.confirm(
      "Run Wikipedia autofill for topics with missing schema information? This may take up to a minute."
    );
    if (!shouldProceed) return;

    setBulkUpdating(true);
    try {
      const response = await fetch("/api/admin/topics/wiki-search/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 100 }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Bulk update failed");
      }

      const summary = result.data;
      toast({
        title: "Bulk update complete",
        description: `Updated ${summary.updated}, failed ${summary.failed}, skipped ${summary.skipped} (candidates: ${summary.candidates}).`,
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Bulk update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBulkUpdating(false);
    }
  };

  const renderTopicRow = (topic: TopicNode, depth = 0) => {
    const hasChildren = (topic.children?.length ?? 0) > 0;
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
            <code className="rounded bg-muted px-2 py-1 text-xs">{topic.slug}</code>
          </TableCell>
          <TableCell>
            <Badge variant={topic.schemaType && topic.schemaType !== "NONE" ? "default" : "outline"}>
              {getSchemaTypeLabel(topic.schemaType)}
            </Badge>
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
                onClick={() => openMergeDialog(topic)}
                title="Merge into another topic"
              >
                <GitMerge className="h-4 w-4 text-blue-500" />
              </Button>
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
        {hasChildren &&
          isExpanded &&
          topic.children?.map((child) => renderTopicRow(child, depth + 1))}
      </Fragment>
    );
  };

  return (
    <div>
      <PageHeader
        title="Topics"
        description="Manage topic hierarchy for categorizing questions"
        action={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBulkWikipediaAutofill}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Bulk Wikipedia Autofill
                </>
              )}
            </Button>
            <Link href="/admin/topics/inference">
              <Button variant="outline">
                Inference Workflow
              </Button>
            </Link>
            <Link href="/admin/topics/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Topic
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Topics are organized in a tree hierarchy. Click arrows to expand/collapse sub-topics.
          Search and filters preserve tree context by showing matching topics with ancestor paths.
        </p>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="mb-4 grid gap-3 rounded-md border bg-card p-4 md:grid-cols-5"
      >
        <div className="md:col-span-2">
          <label htmlFor="topic-search" className="mb-1 block text-sm font-medium">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="topic-search"
              placeholder="Search by name, slug, or description..."
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="topic-schema" className="mb-1 block text-sm font-medium">
            Schema
          </label>
          <select
            id="topic-schema"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={schema}
            onChange={(event) => setSchema(event.target.value)}
          >
            <option value="all">All schema types</option>
            <option value="needs-config">Needs schema config</option>
            <option value="NONE">None</option>
            <option value="SPORT">Sport</option>
            <option value="SPORTS_TEAM">Sports Team</option>
            <option value="ATHLETE">Athlete</option>
            <option value="SPORTS_ORGANIZATION">Sports Organization</option>
            <option value="SPORTS_EVENT">Sports Event</option>
          </select>
        </div>

        <div>
          <label htmlFor="topic-level" className="mb-1 block text-sm font-medium">
            Level
          </label>
          <select
            id="topic-level"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          >
            <option value="all">All levels</option>
            {filterOptions.levels.map((levelOption) => (
              <option key={levelOption} value={String(levelOption)}>
                Level {levelOption}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit">Apply</Button>
          <Button type="button" variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </form>

      <div className="mb-4 text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{counts.matched}</span> of{" "}
        <span className="font-medium text-foreground">{counts.total}</span> topic
        {counts.total === 1 ? "" : "s"}
        {hasActiveFilters ? (
          <span>
            {" "}(direct matches: <span className="font-medium text-foreground">{counts.directMatches}</span>)
          </span>
        ) : null}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Schema Type</TableHead>
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
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  No topics match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing roots{" "}
          <span className="font-medium">
            {startRoot}-{endRoot}
          </span>{" "}
          of <span className="font-medium">{pagination.totalRoots}</span>
        </div>
        <AdminPaginationClient
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          variant="client"
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{topicToDelete?.name}&quot;?

              {topicToDelete && (
                <div className="mt-4 space-y-2">
                  {topicToDelete._count.questions > 0 && (
                    <div className="font-medium text-destructive">
                      ⚠️ This topic has {topicToDelete._count.questions} question(s)
                    </div>
                  )}
                  {topicToDelete._count.children > 0 && (
                    <div className="font-medium text-destructive">
                      ⚠️ This topic has {topicToDelete._count.children} sub-topic(s)
                    </div>
                  )}
                  {topicToDelete._count.quizTopicConfigs > 0 && (
                    <div className="font-medium text-destructive">
                      ⚠️ This topic is used in {topicToDelete._count.quizTopicConfigs} quiz configuration(s)
                    </div>
                  )}
                  {(topicToDelete._count.questions > 0 ||
                    topicToDelete._count.children > 0 ||
                    topicToDelete._count.quizTopicConfigs > 0) && (
                    <p className="mt-2 text-sm">
                      You must remove/reassign all dependencies before deleting this topic.
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Topic</DialogTitle>
            <div className="text-sm text-muted-foreground">
              Merge &quot;{topicToMerge?.name}&quot; into another topic.
              All questions, sub-topics, and stats will be moved.
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination Topic</label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                  >
                    {destinationTopicId
                      ? (() => {
                          const selected =
                            topicToMerge &&
                            getMergeableTopics(topicToMerge.id).find((topic) => topic.id === destinationTopicId);
                          return selected
                            ? `${selected.name} ${selected.level > 0 ? `(Level ${selected.level})` : "(Root)"}`
                            : "Select destination topic...";
                        })()
                      : "Select destination topic..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search topics..." />
                    <CommandList>
                      <CommandEmpty>No topic found.</CommandEmpty>
                      <CommandGroup>
                        {topicToMerge &&
                          getMergeableTopics(topicToMerge.id).map((topic) => (
                            <CommandItem
                              key={topic.id}
                              value={`${topic.name} ${topic.id}`}
                              onSelect={() => {
                                setDestinationTopicId(topic.id);
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  destinationTopicId === topic.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {topic.name} {topic.level > 0 ? `(Level ${topic.level})` : "(Root)"}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {topicToMerge && (
              <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
                <div className="mb-1 font-medium text-blue-600 dark:text-blue-400">Resources to be moved:</div>
                <div>• {topicToMerge._count.questions} Question(s)</div>
                <div>• {topicToMerge._count.children} Sub-topic(s)</div>
                <div>• {topicToMerge._count.quizTopicConfigs} Quiz Config(s)</div>
                <div className="mt-2 text-xs italic text-muted-foreground">
                  Note: The source topic &quot;{topicToMerge.name}&quot; will be deleted.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)} disabled={merging}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleMerge}
              disabled={merging || !destinationTopicId}
            >
              {merging ? "Merging..." : "Confirm Merge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
