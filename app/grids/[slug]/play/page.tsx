import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GridGame } from "@/components/grid/GridGame";
import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function GridPlayPage({ params }: PageProps) {
    const { slug } = await params;
    const session = await auth();

    if (!session || !session.user) {
        redirect(`/api/auth/signin?callbackUrl=/grids/${slug}/play`);
    }

    const grid = await db.gridQuiz.findUnique({
        where: { slug },
    });

    if (!grid) {
        notFound();
    }

    return <GridGame grid={grid} userId={session.user.id} />;
}
