import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found.");
        return;
    }

    try {
        // We can't list models directly with the high-level SDK easily in one line without model instance?
        // Actually we can use the API directly via fetch to list models.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.displayName})`);
                console.log(`  Supported methods: ${m.supportedGenerationMethods?.join(', ')}`);
            });
        } else {
            console.log("No models returned or error:", data);
        }
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
