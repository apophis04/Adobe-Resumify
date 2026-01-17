# Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER (Adobe Express)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │   Frontend: React/TypeScript Add-on    │
        │  (src/components/App.tsx + App.css)    │
        │                                        │
        │  • File upload (PDF)                  │
        │  • Form inputs (job role, industry)   │
        │  • Display analysis & variants        │
        │  • Canvas injection button            │
        └────────────┬──────────────────────────┘
                     │
        ┌────────────▼──────────────────────┐
        │  HTTP Requests (fetch API)        │
        │                                   │
        │ POST /api/resume/analyze          │
        │ POST /api/resume/enhance          │
        └────────────┬──────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │   Backend: Node.js/Express         │
        │          (server.js)               │
        │                                    │
        │  ┌─────────────────────────────┐  │
        │  │ /api/resume/analyze         │  │
        │  │                             │  │
        │  │ 1. Receive PDF file         │  │
        │  │ 2. Convert to base64        │  │
        │  │ 3. Send to OpenAI gpt-4o    │  │
        │  │ 4. Return insights          │  │
        │  └─────────────────────────────┘  │
        │                                    │
        │  ┌─────────────────────────────┐  │
        │  │ /api/resume/enhance         │  │
        │  │                             │  │
        │  │ 1. Receive resume text      │  │
        │  │ 2. Get job context          │  │
        │  │ 3. Send to OpenAI gpt-3.5   │  │
        │  │ 4. Return enhanced text     │  │
        │  └─────────────────────────────┘  │
        └────────────┬──────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │      OpenAI API                    │
        │                                    │
        │  • gpt-4o (vision - PDF analysis)  │
        │  • gpt-3.5-turbo (enhancement)     │
        └────────────────────────────────────┘
```

## Data Flow: Resume Analysis

```
User Selects PDF
    │
    ▼
Frontend: handleFileUpload()
    │
    ├─ Read file as ArrayBuffer
    │
    ▼
POST /api/resume/analyze
    │ (multipart/form-data: PDF)
    │
    ▼
Backend: Parse multipart
    │
    ├─ Extract PDF buffer
    │
    ▼
Convert to base64
    │
    ▼
Call OpenAI gpt-4o
    │
    ├─ Request: base64 PDF image
    ├─ System prompt: Analyze resume
    ├─ User prompt: Extract skills, experience, recommendations
    │
    ▼
Parse gpt-4o response
    │
    ├─ Extract JSON: { key_skills, experience_level, ats_improvements }
    │
    ▼
Return JSON Response
    │ { insights: string, extracted_text: string }
    │
    ▼
Frontend: Display in Resume Insights Panel
    │
    ├─ Show loading state
    ├─ Parse response
    ├─ Update state: resumeText, resumeInsights
    │
    ▼
User sees: Skills, Experience, ATS tips
```

## Data Flow: Resume Enhancement

```
User Clicks "Enhance Resume"
    │
    ▼
Frontend: handleEnhanceWithOpenAI()
    │
    ├─ Validate: resumeText exists
    │
    ▼
Collect Context
    │
    ├─ resume_text (from state)
    ├─ job_role (from input)
    ├─ industry (from input)
    ├─ job_description (from textarea)
    │
    ▼
POST /api/resume/enhance
    │ (JSON: { resume_text, job_role, industry, job_description })
    │
    ▼
Backend: Parse request
    │
    ├─ Truncate resume to 2500 chars (API limit)
    ├─ Truncate job description to 1500 chars
    │
    ▼
Build Prompt
    │
    ├─ System: "Resume writer + ATS expert"
    ├─ User: "Rewrite for [role] in [industry]"
    ├─ Include: Job description context
    ├─ Constraints: Keep facts true, improve clarity
    │
    ▼
Call OpenAI gpt-3.5-turbo
    │
    ├─ Temperature: 0.2 (deterministic)
    ├─ Max tokens: 1200
    │
    ▼
Extract Response
    │
    ├─ Get: choices[0].message.content
    │
    ▼
Return JSON Response
    │ { enhanced_text: string }
    │
    ▼
Frontend: Update Resume
    │
    ├─ Update state: resumeText
    ├─ Clear selected variant
    │
    ▼
Trigger Variant Generation
    │
    ├─ Client-side algorithm
    ├─ No API calls needed
    ├─ Returns 3 variants
    │
    ▼
User sees: 3 variants to choose from
```

## Client-Side Variant Generation (No API)

```
Frontend: handleOptimize()
    │
    ├─ Extract keywords from job description
    ├─ Score current resume (ATS scoring)
    │
    ▼
buildVariants() for each variant:
    │
    ├─ Variant 1: Skills-focused
    │  └─ Reorder sections, highlight technical skills
    │
    ├─ Variant 2: Experience-focused
    │  └─ Emphasize years and leadership
    │
    ├─ Variant 3: Keyword-focused
    │  └─ Add job description keywords
    │
    ▼
Return 3 variants
    │
    ├─ Each with: score, variant_text
    │
    ▼
Frontend: Display variant cards
    │
    ├─ User selects one
    ├─ Click "Use this variant"
    │
    ▼
Update Final Resume Panel
```

## Frontend Component Structure

```
App.tsx
├── State Variables
│   ├── Input: resumeText, jobRole, industry, jobDescription
│   ├── Output: analysis (score, variants, keywords, etc)
│   ├── UI: injection, finalSelection, enhancing, reading
│   └── Display: resumeInsights, enhanceMessage
│
├── Core Handlers
│   ├── handleFileUpload(file)         → POST /api/resume/analyze
│   ├── handleEnhanceWithOpenAI()      → POST /api/resume/enhance
│   ├── handleOptimize()               → Client-side analysis
│   └── handleInject()                 → Canvas injection attempt
│
├── Helper Functions
│   ├── extractKeywords(text)          → Word frequency analysis
│   ├── scoreResume(text, keywords)    → ATS scoring heuristic
│   ├── buildVariants()                → 3 variant generation
│   ├── buildCoverLetter()             → Cover letter text
│   ├── buildLinkedIn()                → LinkedIn summary
│   └── detectSections(text)           → Section parsing
│
├── Render
│   ├── Hero section (header + badge)
│   ├── Input grid (file, forms, textarea)
│   ├── Output panels
│   │   ├── Resume Insights (loading state)
│   │   ├── Variant cards (3 variants)
│   │   └── Final Resume (selected variant)
│   └── Footer actions (inject, export)
│
└── Styling (App.css)
    ├── Hero + gradient
    ├── Grid layout (responsive)
    ├── Cards and panels
    ├── Color scheme (slate + blue)
    └── Media queries for mobile
```

## Backend Endpoint Structure

```
server.js
├── Middleware
│   ├── Express JSON parser (50MB limit)
│   ├── Express static file serving
│   └── Multer file upload handler
│
├── POST /api/resume/analyze
│   ├── Input validation
│   ├── PDF buffer → base64
│   ├── OpenAI gpt-4o call
│   │   ├── Vision capability
│   │   ├── Extract: skills, level, recommendations
│   │   └── Parse JSON response
│   └── Return: { insights, extracted_text }
│
├── POST /api/resume/enhance
│   ├── Input validation
│   ├── Text truncation (2500 + 1500 chars)
│   ├── Prompt building
│   ├── OpenAI gpt-3.5-turbo call
│   │   ├── System: Resume expert
│   │   ├── User: Rewrite prompt
│   │   └── Extract content
│   └── Return: { enhanced_text }
│
├── Error Handling
│   ├── File validation
│   ├── API error responses
│   └── Logging
│
└── Static Serving
    └── Fallback to dist/index.html (SPA routing)
```

## Environment & Configuration

```
.env (Local Development)
├── OPENAI_API_KEY=sk-...
└── PORT=5000

Production Environment Variables
├── OPENAI_API_KEY (from secrets manager)
├── PORT (from container/platform)
├── NODE_ENV=production
└── CORS_ORIGINS=... (if needed)
```

## Technology Stack Summary

```
Frontend
├── React 18.2.0 (UI framework)
├── TypeScript (type safety)
├── Spectrum Web Components (Adobe design)
└── Webpack 5 (bundling)

Backend
├── Node.js + Express (server)
├── OpenAI API (AI processing)
├── Multer (file uploads)
├── Dotenv (configuration)
└── Node-fetch (HTTP requests)

APIs
├── OpenAI gpt-4o (vision, PDF analysis)
├── OpenAI gpt-3.5-turbo (text enhancement)
└── Adobe Express SDK (canvas injection)
```

## Deployment Architecture

```
Development
├── Frontend: localhost:9001 (Adobe Express dev)
├── Backend: localhost:5000
└── OpenAI: api.openai.com (cloud)

Production
├── Frontend: Adobe Express CDN + storage
├── Backend: Cloud platform (Heroku, AWS, GCP, etc.)
│   └── Environment: OPENAI_API_KEY, PORT
└── OpenAI: api.openai.com (cloud)

Data Flow (Production)
├── User: Adobe Express add-on
├── Connects to: Backend (your cloud server)
├── Backend calls: OpenAI API
└── Response: Back to user
```

---

This architecture ensures:
✅ Clean separation of concerns
✅ Secure API key management
✅ Scalable backend
✅ Responsive frontend
✅ Flexible deployment options
