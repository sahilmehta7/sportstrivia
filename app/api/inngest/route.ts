import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
// We will import functions here as we create them
import { generateQuiz } from "@/lib/inngest/functions/generateQuiz";
import { generateQuestions } from "@/lib/inngest/functions/generateQuestions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        generateQuiz,
        generateQuestions,
    ],
});
