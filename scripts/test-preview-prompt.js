const fetch = require('node-fetch');

async function testPreviewPrompt() {
    const payload = {
        topic: "Cricket",
        difficulty: "MEDIUM",
        numQuestions: 5
    };

    try {
        const response = await fetch("http://localhost:3000/api/admin/ai/preview-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const result = await response.json();
        console.log("Status:", response.status);
        console.log("Result:", JSON.stringify(result, null, 2));

        if (result.data && result.data.prompt) {
            console.log("✅ Success! Prompt received.");
            console.log("Prompt length:", result.data.prompt.length);
        } else {
            console.log("❌ Failed! No prompt in response.");
        }
    } catch (error) {
        console.error("Error testing preview-prompt:", error.message);
    }
}

testPreviewPrompt();
