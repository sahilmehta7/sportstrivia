import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { CollectionStatus, CollectionType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  addQuizToCollection,
  removeQuizFromCollection,
  reorderCollectionQuizzes,
  updateCollection,
} from "@/lib/services/collection.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function updateCollectionAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await updateCollection(id, {
    name: String(formData.get("name") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || null,
    status: String(formData.get("status") ?? "") as CollectionStatus,
    type: String(formData.get("type") ?? "") as CollectionType,
    isFeatured: String(formData.get("isFeatured") ?? "") === "on",
    primaryTopicId: String(formData.get("primaryTopicId") ?? "").trim() || null,
  });

  revalidatePath(`/admin/collections/${id}`);
  revalidatePath("/admin/collections");
}

async function addQuizAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const quizId = String(formData.get("quizId") ?? "");
  if (!id || !quizId) return;

  await addQuizToCollection(id, { quizId });
  revalidatePath(`/admin/collections/${id}`);
}

async function reorderAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const quizIds = formData.getAll("quizId").map(String);
  const orders = formData
    .getAll("order")
    .map((value) => Number(value) || 0);

  const items = quizIds.map((quizId, index) => ({
    quizId,
    order: orders[index],
  }));
  await reorderCollectionQuizzes(id, items);
  revalidatePath(`/admin/collections/${id}`);
}

async function removeQuizAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const quizId = String(formData.get("quizId") ?? "");
  if (!id || !quizId) return;

  await removeQuizFromCollection(id, quizId);
  revalidatePath(`/admin/collections/${id}`);
}

export default async function AdminCollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [collection, quizzes, topics] = await Promise.all([
    prisma.collection.findUnique({
      where: { id },
      include: {
        quizzes: {
          orderBy: { order: "asc" },
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                slug: true,
                isPublished: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    prisma.quiz.findMany({
      where: {
        status: "PUBLISHED",
        isPublished: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    }),
    prisma.topic.findMany({
      where: { entityStatus: "READY" },
      orderBy: { name: "asc" },
      take: 200,
      select: {
        id: true,
        name: true,
        schemaType: true,
      },
    }),
  ]);

  if (!collection) notFound();

  const collectionQuizIds = new Set(collection.quizzes.map((entry) => entry.quizId));
  const availableQuizzes = quizzes.filter((quiz) => !collectionQuizIds.has(quiz.id));

  return (
    <div className="space-y-8">
      <PageHeader title={collection.name} description={`Manage /collections/${collection.slug}`} />

      <Card>
        <CardHeader>
          <CardTitle>Collection Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateCollectionAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="id" value={collection.id} />
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input name="name" defaultValue={collection.name} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Primary topic</label>
              <select
                name="primaryTopicId"
                defaultValue={collection.primaryTopicId ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name} ({topic.schemaType})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                name="description"
                defaultValue={collection.description ?? ""}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select
                name="type"
                defaultValue={collection.type}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.values(CollectionType).map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                name="status"
                defaultValue={collection.status}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.values(CollectionStatus).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={collection.isFeatured} />
              Featured
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Save settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addQuizAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={collection.id} />
            <select
              name="quizId"
              required
              className="min-w-[320px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select quiz</option>
              {availableQuizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title} ({quiz.slug})
                </option>
              ))}
            </select>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ordered Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {collection.quizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quizzes in this collection yet.</p>
          ) : (
            <>
              <form action={reorderAction} className="space-y-3">
                <input type="hidden" name="id" value={collection.id} />
                {collection.quizzes.map((entry) => (
                  <div
                    key={entry.quizId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{entry.quiz.title}</p>
                      <p className="text-xs text-muted-foreground">{entry.quiz.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="hidden" name="quizId" value={entry.quizId} />
                      <label className="text-xs text-muted-foreground">Order</label>
                      <Input name="order" type="number" min={1} defaultValue={entry.order} className="w-24" />
                      <Badge variant="outline">{entry.quiz.status}</Badge>
                    </div>
                  </div>
                ))}
                <Button type="submit">Save order</Button>
              </form>

              <div className="space-y-2 border-t border-border/50 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Remove quiz from collection
                </p>
                {collection.quizzes.map((entry) => (
                  <form key={`remove_${entry.quizId}`} action={removeQuizAction} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
                    <input type="hidden" name="id" value={collection.id} />
                    <input type="hidden" name="quizId" value={entry.quizId} />
                    <span className="text-sm">{entry.quiz.title}</span>
                    <Button type="submit" variant="outline" size="sm">
                      Remove
                    </Button>
                  </form>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
