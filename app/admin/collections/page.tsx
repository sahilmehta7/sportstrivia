import Link from "next/link";
import { revalidatePath } from "next/cache";
import { CollectionStatus, CollectionType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { createCollection, listAdminCollections } from "@/lib/services/collection.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

async function createCollectionAction(formData: FormData) {
  "use server";
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await createCollection({
    name,
    slug: String(formData.get("slug") ?? "").trim() || undefined,
    type:
      (String(formData.get("type") ?? "") as CollectionType) ||
      CollectionType.EDITORIAL,
    status:
      (String(formData.get("status") ?? "") as CollectionStatus) ||
      CollectionStatus.DRAFT,
    isFeatured: String(formData.get("isFeatured") ?? "") === "on",
  });

  revalidatePath("/admin/collections");
}

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = (await searchParams) ?? {};
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit ?? 20) || 20));
  const search = typeof params.search === "string" ? params.search : undefined;
  const status =
    typeof params.status === "string" &&
    Object.values(CollectionStatus).includes(params.status as CollectionStatus)
      ? (params.status as CollectionStatus)
      : undefined;
  const type =
    typeof params.type === "string" &&
    Object.values(CollectionType).includes(params.type as CollectionType)
      ? (params.type as CollectionType)
      : undefined;

  const payload = await listAdminCollections({
    page,
    limit,
    status,
    type,
    search,
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Collections" description="Manage editorial collection journeys." />

      <Card>
        <CardHeader>
          <CardTitle>Create Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCollectionAction} className="grid gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <Input name="name" placeholder="Collection name" required />
            </div>
            <div>
              <Input name="slug" placeholder="Optional slug" />
            </div>
            <div>
              <select
                name="type"
                defaultValue={CollectionType.EDITORIAL}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.values(CollectionType).map((entry) => (
                  <option key={entry} value={entry}>
                    {entry.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                name="status"
                defaultValue={CollectionStatus.DRAFT}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.values(CollectionStatus).map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFeatured" />
                Featured
              </label>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payload.collections.map((collection) => (
            <div
              key={collection.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
            >
              <div className="space-y-1">
                <p className="font-medium">{collection.name}</p>
                <p className="text-xs text-muted-foreground">
                  /collections/{collection.slug} • {collection._count.quizzes} quizzes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{collection.type.replaceAll("_", " ")}</Badge>
                <Badge variant={collection.status === "PUBLISHED" ? "default" : "outline"}>
                  {collection.status}
                </Badge>
                <Link href={`/admin/collections/${collection.id}`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {payload.collections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No collections found.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
