
import { z } from "zod";

// Mocking the enum to avoid prisma dependency in this isolated script
enum Difficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
}

const difficultySchema = z.preprocess(
    (val) => {
        console.log("Preprocessing value:", val, typeof val);
        return typeof val === "string" ? val.toUpperCase() : val;
    },
    z.nativeEnum(Difficulty)
);

const questionsImportSchema = z.object({
    questions: z.array(z.object({
        text: z.string().min(1),
        difficulty: difficultySchema.default(Difficulty.MEDIUM),
    })).min(1),
});

const testData = {
    questions: [
        { text: "Q1", difficulty: "easy" },
        { text: "Q2", difficulty: "MEDIUM" },
        { text: "Q3", difficulty: "Hard" },
        { text: "Q4", difficulty: "invalid" },
    ]
};

console.log("Testing schema validation...");
try {
    const result = questionsImportSchema.parse(testData);
    console.log("Validation success:", JSON.stringify(result, null, 2));
} catch (error) {
    if (error instanceof z.ZodError) {
        console.log("Validation failed:");
        console.log(JSON.stringify(error.errors, null, 2));
    } else {
        console.error("Unknown error:", error);
    }
}
