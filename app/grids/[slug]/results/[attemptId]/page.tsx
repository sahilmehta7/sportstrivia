
import { auth } from "@/lib/auth";
import GridResultsClient from "@/components/grid/GridResultsClient";

interface PageProps {
    params: Promise<{ slug: string; attemptId: string }>;
}

export default async function GridResultsPage({ params }: PageProps) {
    const { slug, attemptId } = await params;
    const session = await auth();

    if (!session || !session.user) {
        // We can allow public viewing of results if we want, 
        // but the API route currently checks auth.
        // For now, let's keep it simple.
    }

    return (
        <div className="container py-12">
            <GridResultsClient quizSlug={slug} attemptId={attemptId} />
        </div>
    );
}
