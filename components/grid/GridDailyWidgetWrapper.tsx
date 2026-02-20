import { db } from "@/lib/db";
import { GridDailyWidget } from "./GridDailyWidget";

export async function GridDailyWidgetWrapper() {
    let latestGrid = null;
    try {
        // Fetch the latest published Grid
        // In a real "Daily" system, we'd filter for a specific scheduled date, 
        // but for now, we'll take the most recent published one.
        latestGrid = await db.gridQuiz.findFirst({
            where: { status: "PUBLISHED" },
            orderBy: { createdAt: "desc" },
        });

    } catch (error) {
        console.error("Error fetching daily grid widget data:", error);
    }

    if (!latestGrid) return null;

    return <GridDailyWidget grid={latestGrid} />;
}
