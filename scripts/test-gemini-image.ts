import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Note: This script tests the Gemini integration logic directly without Next.js specifics.
// It verifies the API key and the image generation capability.

async function testGeminiIntegration() {
    console.log("🔍 Testing Gemini Integration...");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is not set in environment variables.");
        process.exit(1);
    }

    // 1. Test Prompt Generation (Gemini 2.0 Flash)
    console.log("\n1️⃣ Testing Prompt Generation (Gemini 2.0 Flash)...");
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-2.0-flash-exp again as it is available (previous 429 was transient)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = "Write a short, vivid description for a sports quiz cover image about 'Football World Cup'. Max 20 words.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log("✅ Prompt Generated:", text.trim());

        // 2. Test Image Generation (Imagen 4)
        console.log("\n2️⃣ Testing Image Generation (Imagen 4)...");

        const imageModel = "imagen-4.0-generate-001";
        // NOTE: Using the same fetch logic as the implementation
        const imagenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:predict?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: text.trim(),
                    }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "16:9",
                }
            })
        });

        if (imagenResponse.ok) {
            const resultJson = await imagenResponse.json();
            const predictions = resultJson.predictions;
            if (predictions && predictions.length > 0 && predictions[0].bytesBase64Encoded) {
                console.log("✅ Image Generated Successfully! (Base64 data received)");
                console.log(`   Data length: ${predictions[0].bytesBase64Encoded.length} chars`);
            } else {
                console.error("❌ Image API returned success but no image data found.");
                console.error("   Response:", JSON.stringify(resultJson, null, 2));
            }
        } else {
            const errorText = await imagenResponse.text();
            console.error(`❌ Image Generation Failed: ${imagenResponse.status} ${imagenResponse.statusText}`);
            console.error("   Error Details:", errorText);
        }

    } catch (error) {
        console.error("❌ Test Failed with Exception:", error);
    }
}

testGeminiIntegration();
