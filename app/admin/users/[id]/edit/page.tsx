"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, TrendingUp, Award, Users, Star } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "USER",
    bio: "",
    favoriteTeams: "",
  });

  useEffect(() => {
    async function loadUser() {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);

      try {
        const response = await fetch(`/api/admin/users/${resolvedParams.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load user");
        }

        const userData = result.data.user;
        setUser(userData);

        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          role: userData.role || "USER",
          bio: userData.bio || "",
          favoriteTeams: (userData.favoriteTeams || []).join(", "),
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        router.push("/admin/users");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [params, router, toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        bio: formData.bio || null,
        favoriteTeams: formData.favoriteTeams
          ? formData.favoriteTeams.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user");
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      router.push("/admin/users");
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Edit User"
        description={`Manage ${user.name || user.email}'s account and permissions`}
      />

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Longest: {user.longestStreak} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Attempts</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.quizAttempts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Friends</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.friends}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.reviews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update user profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="User's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="User's bio or description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favoriteTeams">Favorite Teams</Label>
              <Input
                id="favoriteTeams"
                value={formData.favoriteTeams}
                onChange={(e) =>
                  setFormData({ ...formData, favoriteTeams: e.target.value })
                }
                placeholder="Team 1, Team 2, Team 3"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of favorite teams
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Manage user role and access level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                <p className="font-medium">Role Permissions:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    <strong>User:</strong> Can take quizzes, track progress, and
                    participate in leaderboards
                  </li>
                  <li>
                    <strong>Moderator:</strong> Can manage questions, quizzes, and
                    review reports
                  </li>
                  <li>
                    <strong>Admin:</strong> Full access to all features including user
                    management
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Read-only account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">User ID</Label>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Active</Label>
                <p className="text-sm">{formatDate(user.lastActiveDate)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email Verified</Label>
                <p className="text-sm">
                  {user.emailVerified ? formatDate(user.emailVerified) : "Not verified"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {user.quizAttempts && user.quizAttempts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Attempts</CardTitle>
              <CardDescription>Last 10 quiz attempts by this user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.quizAttempts.map((attempt: any) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/quizzes/${attempt.quiz.slug}`}
                        className="font-medium hover:underline"
                      >
                        {attempt.quiz.title}
                      </Link>
                      {attempt.passed && (
                        <Badge variant="default" className="text-xs">
                          Passed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      {attempt.score !== null && (
                        <span>Score: {attempt.score.toFixed(0)}%</span>
                      )}
                      <span>
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                        }).format(new Date(attempt.createdAt))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Topics */}
        {user.topicStats && user.topicStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Topics by Success Rate</CardTitle>
              <CardDescription>User's best performing topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.topicStats.map((stat: any) => (
                  <div
                    key={stat.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{stat.topic.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {stat.questionsAnswered} questions
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {stat.questionsCorrect} / {stat.questionsAnswered} correct
                      </span>
                      <span className="font-semibold text-primary">
                        {stat.successRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/users">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
