
import { questionsImportSchema } from './lib/validations/quiz.schema';
import { Difficulty } from '@prisma/client';

async function main() {
    console.log('--- TEST: CASE-INSENSITIVE DIFFICULTY ---');

    const testCases = [
        { difficulty: 'easy', expected: Difficulty.EASY },
        { difficulty: 'MEDIUM', expected: Difficulty.MEDIUM },
        { difficulty: 'hard', expected: Difficulty.HARD },
        { difficulty: 'EaSy', expected: Difficulty.EASY },
        { difficulty: undefined, expected: Difficulty.MEDIUM }, // Default value
    ];

    for (const testCase of testCases) {
        const body = {
            questions: [
                {
                    text: "Test Question",
                    difficulty: testCase.difficulty,
                    topic: "Test Topic",
                    answers: [
                        { text: "A", isCorrect: true },
                        { text: "B", isCorrect: false },
                    ],
                },
            ],
        };

        const result = questionsImportSchema.safeParse(body);

        if (result.success) {
            const parsedDifficulty = result.data.questions[0].difficulty;
            const status = parsedDifficulty === testCase.expected ? 'PASS' : 'FAIL';
            console.log(`Input: ${testCase.difficulty} -> Parsed: ${parsedDifficulty} | ${status}`);
        } else {
            console.log(`Input: ${testCase.difficulty} -> FAILED VALIDATION`);
            console.log(JSON.stringify(result.error.format(), null, 2));
        }
    }
}

main().catch(console.error);
