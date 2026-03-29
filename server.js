require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ API Key Loaded Successfully.");
} else {
    console.warn("⚠️ Warning: GEMINI_API_KEY missing in .env. Setup required.");
}

async function generateFromGemini(prompt, res) {
    try {
        if (!genAI) {
            return res.status(500).json({ error: "<h3>API Key Missing 🚨</h3><p>Sir, App server is fully built! Lakin abhi API Key empty hai.</p><p>1. <code>.env</code> file open karein.<br>2. Wahan Google AI Studio se 'gemini' ki free key daalain.</p>" });
        }
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        let rawHtmlResult = result.response.text();
        
        // Minor cleanups in case gemini hallucinates markdown fences
        rawHtmlResult = rawHtmlResult.replace(/```html/g, '').replace(/```/g, '');

        res.json({ result: rawHtmlResult });
    } catch (err) {
        console.error("AI Generation Error: ", err);
        res.status(500).json({ error: "Failed to generate context from AI." });
    }
}

app.post('/api/resume', (req, res) => {
    const { jobTitle, skills } = req.body;
    const prompt = `Act as an expert ATS Resume writer. Create a professional, concise resume summary and experience points for the job title: ${jobTitle}. Incorporate these skills: ${skills}. Format the output using basic HTML tags like <h4>, <ul>, <li>, and <br> so it displays well on a web page. Keep it extremely professional. Don't use markdown code blocks (\`\`\`), just raw html.`;
    generateFromGemini(prompt, res);
});

app.post('/api/script', (req, res) => {
    const { topic, tone } = req.body;
    const prompt = `Write a viral 30-second script for TikTok/Instagram Reels about "${topic}". The tone should be ${tone}. Structure it cleanly with HTML tags: <h4>[Hook 0:00-0:03]</h4> followed by the hook text, then <h4>[Body 0:03-0:20]</h4> followed by text, and <h4>[Call to Action 0:20-0:30]</h4>. Keep it engaging. Output only HTML, no markdown codeblocks.`;
    generateFromGemini(prompt, res);
});

app.post('/api/email', (req, res) => {
    const { recipient, goal, tone } = req.body;
    const prompt = `Write an email to ${recipient}. The goal of the email is: ${goal}. The tone must be ${tone}. Write ONLY the email content, including the subject line as an <h3> tag. Format the body with <br> for newlines. Output only HTML without markdown code blocks.`;
    generateFromGemini(prompt, res);
});

app.post('/api/enhance-image', (req, res) => {
    res.json({ result: "<h4 style='color: var(--accent-primary)'>Image Uploaded Successfully! 📸</h4><p>Server accepted the image. To implement true upscaling logic, link an API like Midjourney or Replicate here in <code>server.js</code>.</p>" });
});

// Fallback point
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 OmniAI Server running on http://localhost:${PORT}`);
});

module.exports = app;
