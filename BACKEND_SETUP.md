# Resume Optimizer Add-on Backend & Frontend

A comprehensive Adobe Express Add-on that optimizes resumes for ATS compatibility and specific job roles using AI.

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── App.tsx          # Main React component
│   │   └── App.css          # Styling
│   ├── index.tsx            # React entry point
│   └── index.html           # HTML template
├── server.js                 # Node.js Express backend
├── .env                      # Environment variables (OpenAI key)
├── package.json              # Dependencies
├── manifest.json             # Adobe add-on manifest
└── tsconfig.json             # TypeScript config
```

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- OpenAI API Key (from https://platform.openai.com/api-keys)

### Installation

1. **Clone/Extract the project**
   ```bash
   cd "d:\Adobe smaples\final-test"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Edit `.env` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   PORT=5000
   ```

4. **Build the frontend**
   ```bash
   npm run build
   ```

## Running the Application

### Option 1: Run Backend Only (for testing with deployed frontend)
```bash
npm run server
```
Backend runs on `http://localhost:5000`

### Option 2: Run Frontend Only (for Adobe Express testing)
```bash
npm run start
```
Starts Adobe Express development environment on `http://localhost:9001` (or specified port)

### Option 3: Run Both Simultaneously (Recommended for development)
```bash
npm run dev
```
- Frontend: `http://localhost:9001` (Adobe Express panel)
- Backend: `http://localhost:5000` (API server)

## Frontend to Backend Communication

The frontend (Adobe add-on) calls two backend endpoints:

### 1. POST /api/resume/analyze
Analyzes a PDF resume and extracts insights.

**Request:**
```
Content-Type: multipart/form-data
Body: FormData with "resume" file (PDF)
```

**Response:**
```json
{
  "insights": "Skills: Python, AWS, Leadership...\nExperience Level: Senior\nATS Improvements: ...",
  "extracted_text": "Resume analyzed. Ready to enhance..."
}
```

### 2. POST /api/resume/enhance
Enhances resume text for a specific job role and industry.

**Request:**
```json
{
  "resume_text": "Full resume text here...",
  "job_role": "Senior Software Engineer",
  "industry": "Technology",
  "job_description": "Job description text..."
}
```

**Response:**
```json
{
  "enhanced_text": "Rewritten resume text optimized for the role..."
}
```

## Frontend Features

- 📄 **PDF Resume Upload** - Upload and analyze resumes
- 🤖 **AI Enhancement** - Optimize resume for specific roles using OpenAI
- 🎯 **ATS Scoring** - Calculate ATS compatibility score
- 📊 **Keyword Extraction** - Identify and highlight relevant skills
- 🔄 **Variant Generation** - Create 3 optimized resume variants
- 📝 **Additional Content** - Auto-generate cover letter and LinkedIn profile
- 🎨 **Canvas Injection** - Insert optimized resume directly into Adobe Express

## Configuration

### Backend (server.js)
- Uses `gpt-4o` for PDF analysis (vision capability)
- Uses `gpt-3.5-turbo` for resume enhancement (cost-effective)
- Configurable token limits and temperature for API calls
- Error handling with detailed logging

### Frontend (App.tsx)
- Responsive grid layout
- Real-time feedback with loading states
- Color-coded success/error messages
- Spectrum Web Components for consistent Adobe UX

## Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "OPENAI_API_KEY is not set"
- Check `.env` file has valid API key
- Restart backend after updating `.env`

### "Port 5000 already in use"
- Change `PORT` in `.env` file
- Kill process: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`

### API Rate Limiting
- Backend implements reasonable token limits (2500 chars for resume, 1500 for job description)
- Temperature set low (0.2) for deterministic output
- Monitor OpenAI usage dashboard

### PDF Analysis Not Working
- Verify PDF is valid and readable
- Check OpenAI API key has `gpt-4o` access (requires paid account)
- Check OpenAI quota and rate limits

## Deployment

### For Adobe Express Marketplace
1. Build frontend: `npm run build`
2. Package add-on: `npm run package`
3. Upload to Adobe Developer Console

### For Backend
1. Host on cloud provider (Vercel, Heroku, AWS, Google Cloud, etc.)
2. Set `OPENAI_API_KEY` environment variable
3. Update frontend `fetch()` calls if backend is on different domain
4. Configure CORS if needed

### CORS Setup (if frontend and backend on different domains)
Backend `server.js` already handles multipart/json, but if needed, add:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://express.adobe.com', 'http://localhost:9001'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
```

## API Limits

- **OpenAI Rate Limits**: Check [OpenAI dashboard](https://platform.openai.com/account/rate-limits)
- **File Size**: 25MB limit (configurable in server.js via multer)
- **Request Timeout**: 30 seconds (adjust in fetch calls)
- **Resume Text**: Truncated to 2500 characters for API efficiency
- **Job Description**: Truncated to 1500 characters for API efficiency

## Performance Notes

- PDF analysis with gpt-4o: ~3-5 seconds
- Resume enhancement: ~2-3 seconds
- Variant generation (client-side): <1 second
- Total workflow: ~5-8 seconds

## Security Considerations

- ✅ OpenAI API key stored server-side only (not exposed to frontend)
- ✅ File uploads handled securely via multer (memory storage for simplicity)
- ⚠️ For production, use persistent storage with scan/validation
- ⚠️ Implement authentication if needed for team usage
- ⚠️ Add rate limiting to prevent abuse
- ⚠️ Consider PII/data retention policies

## Future Enhancements

- [ ] Save/export resume to PDF
- [ ] Resume template selection
- [ ] Email integration for sharing
- [ ] Analytics and usage tracking
- [ ] Multiple language support
- [ ] Custom keywords/industry-specific rules
- [ ] LinkedIn job posting integration
- [ ] Real-time collaboration

## Support

For issues or questions:
1. Check CloudWatch/server logs for backend errors
2. Check browser console for frontend errors
3. Verify OpenAI API key and quotas
4. Review [OpenAI documentation](https://platform.openai.com/docs)

---

**Created**: January 2026  
**Version**: 1.0.0
