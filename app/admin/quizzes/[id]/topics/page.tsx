"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Save, Settings } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";

interface TopicConfigPageProps {
  params: Promise<{ id: string }>;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
}

interface TopicConfig {
  id: string;
  topicId: string;
  difficulty: string;
  questionCount: number;
  topic: Topic;
}

export default function TopicConfigPage({ params }: TopicConfigPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quizId, setQuizId] = useState<string>("");
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topicConfigs, setTopicConfigs] = useState<TopicConfig[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("MEDIUM");
  const [questionCount, setQuestionCount] = useState<string>("5");

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      setQuizId(resolvedParams.id);

      try {
        // Load topic configurations
        const configResponse = await fetch(`/api/admin/quizzes/${resolvedParams.id}/topics`);
        const configResult = await configResponse.json();

        if (!configResponse.ok) {
          throw new Error(configResult.error || "Failed to load topic configurations");
        }

        setQuizTitle(configResult.data.quiz.title);
        setTopicConfigs(configResult.data.topicConfigs);

        // Load all available topics
        const topicsResponse = await fetch("/api/admin/topics");
        const topicsResult = await topicsResponse.json();

        if (!topicsResponse.ok) {
          throw new Error(topicsResult.error || "Failed to load topics");
        }

        setAvailableTopics(topicsResult.data.topics || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, toast]);

  const handleAddTopic = async () => {
    if (!selectedTopic) {
      toast({
        title: "Error",
        description: "Please select a topic",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: selectedTopic,
          difficulty,
          questionCount: parseInt(questionCount),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add topic configuration");
      }

      setTopicConfigs([...topicConfigs, result.data]);
      setAddDialogOpen(false);
      setSelectedTopic("");
      setDifficulty("MEDIUM");
      setQuestionCount("5");

      toast({
        title: "Topic added!",
        description: "Topic configuration has been added successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async (configId: string, field: string, value: any) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/topics?configId=${configId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update configuration");
      }

      setTopicConfigs(topicConfigs.map(config => 
        config.id === configId ? result.data : config
      ));

      toast({
        title: "Updated!",
        description: "Topic configuration has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveConfig = async (configId: string) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/topics?configId=${configId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove configuration");
      }

      setTopicConfigs(topicConfigs.filter(config => config.id !== configId));

      toast({
        title: "Removed!",
        description: "Topic configuration has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Don't filter topics - users can add same topic with different difficulties
  const availableTopicsFiltered = availableTopics;

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
        title={`Topic Configuration: ${quizTitle}`}
        description="Configure topics and difficulty levels to randomly select questions from. You can add the same topic multiple times with different difficulties."
        action={
          <div className="flex gap-2">
            <Link href={`/admin/quizzes/${quizId}/edit`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Quiz
              </Button>
            </Link>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Topic
            </Button>
          </div>
        }
      />

      {topicConfigs.length === 0 ? (
        <EmptyState
          icon={Settings}
          title="No topics configured"
          description="Add topics with difficulty levels to configure random question selection. You can add the same topic multiple times with different difficulties."
          action={
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Topic
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configured Topics ({topicConfigs.length})</CardTitle>
              <CardDescription>
                Questions will be randomly selected from these topics at quiz start
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topicConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.topic.name}</span>
                      <Badge variant={
                        config.difficulty === "EASY" ? "secondary" : 
                        config.difficulty === "HARD" ? "destructive" : 
                        "default"
                      }>
                        {config.difficulty}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {config.topic.description || "No description"}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Difficulty</Label>
                      <Select
                        value={config.difficulty}
                        onValueChange={(value) =>
                          handleUpdateConfig(config.id, "difficulty", value)
                        }
                        disabled={saving}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Questions</Label>
                      <Input
                        type="number"
                        min={1}
                        value={config.questionCount}
                        onChange={(e) =>
                          handleUpdateConfig(
                            config.id,
                            "questionCount",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-20"
                        disabled={saving}
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveConfig(config.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total topics configured:</span>
                  <span className="font-medium">{topicConfigs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total questions per quiz:</span>
                  <span className="font-medium">
                    {topicConfigs.reduce((sum, config) => sum + config.questionCount, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Topic Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Topic Configuration</DialogTitle>
            <DialogDescription>
              Select a topic, difficulty level, and configure how many questions to randomly select.
              You can add the same topic multiple times with different difficulty levels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Topic *</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {availableTopicsFiltered.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No topics available
                    </div>
                  ) : (
                    availableTopicsFiltered.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {"  ".repeat(topic.level)}
                        {topic.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty *</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Questions *</Label>
              <Input
                type="number"
                min={1}
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                placeholder="e.g., 5"
              />
              <p className="text-xs text-muted-foreground">
                How many random questions to select from this topic
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTopic} 
              disabled={saving || !selectedTopic}
            >
              {saving ? "Adding..." : "Add Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

