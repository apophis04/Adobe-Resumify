const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const path = require("path");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Security headers and CORS for Adobe Express Add-on
app.use((req, res, next) => {
    // Set security headers
    // X-Frame-Options: Prevent clickjacking (but allow Adobe's frames)
    res.header("X-Frame-Options", "SAMEORIGIN");
    // X-Content-Type-Options: Prevent MIME type sniffing
    res.header("X-Content-Type-Options", "nosniff");
    // X-XSS-Protection: Enable XSS filter
    res.header("X-XSS-Protection", "1; mode=block");
    // Referrer-Policy: Control referrer information
    res.header("Referrer-Policy", "strict-origin-when-cross-origin");
    // Content-Security-Policy: Restrict content sources
    res.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com;");
    
    // CORS configuration
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-key-here";
const PORT = process.env.PORT || 5000;

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", port: PORT, hasApiKey: !!process.env.OPENAI_API_KEY });
});

/**
 * POST /api/resume/analyze
 * Analyze PDF resume using OpenAI Vision
 */
app.post("/api/resume/analyze", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const pdfBuffer = req.file.buffer;
        
        // Mock analysis - works without OpenAI API quota
        // Replace with actual PDF parsing + OpenAI when you have API credits
        const analysis = {
            key_skills: ["Communication", "Project Management", "Leadership", "Problem Solving", "Technical Skills"],
            experience_level: "mid",
            ats_improvements: [
                "Add more quantifiable achievements with specific metrics",
                "Include relevant keywords from the job description",
                "Use standard section headings like 'Experience' and 'Skills'"
            ]
        };

        const insights = `
Skills: ${(analysis.key_skills || []).join(", ")}
Experience Level: ${analysis.experience_level || "N/A"}
ATS Improvements:
${(analysis.ats_improvements || []).map((item) => `- ${item}`).join("\n")}
        `.trim();

        res.json({
            insights,
            extracted_text: "Resume analyzed. Ready to enhance and generate variants."
        });
    } catch (err) {
        console.error("Analyze error:", err);
        res.status(500).json({ error: err.message || "Failed to analyze resume" });
    }
});

/**
 * POST /api/resume/enhance
 * Enhance resume using OpenAI
 */
app.post("/api/resume/enhance", async (req, res) => {
    try {
        const { resume_text, job_role, industry, job_description } = req.body;

        if (!resume_text) {
            return res.status(400).json({ error: "Resume text required" });
        }

        const truncatedResume = resume_text.slice(0, 2500);
        const truncatedJD = job_description ? job_description.slice(0, 1500) : "";

        // Mock enhancement - works without OpenAI API quota
        // This simulates the enhancement process
        const enhancedText = `[ENHANCED FOR: ${job_role || "Target Role"} in ${industry || "Industry"}]

${truncatedResume}

[ATS OPTIMIZATION APPLIED]
- Action verbs strengthened
- Keywords from job description integrated
- Metrics and achievements highlighted
- Standard formatting maintained for ATS compatibility

Note: Replace with actual OpenAI enhancement when you have API credits.`;

        res.json({
            enhanced_text: enhancedText.trim()
        });
    } catch (err) {
        console.error("Enhance error:", err);
        res.status(500).json({ error: err.message || "Failed to enhance resume" });
    }
});

// Serve static files AFTER API routes
app.use(express.static(path.join(__dirname, "dist")));

// Fallback to frontend for unmatched routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Resume Optimizer Backend running on port ${PORT}`);
    console.log(`Make sure OPENAI_API_KEY is set in .env file`);
});
