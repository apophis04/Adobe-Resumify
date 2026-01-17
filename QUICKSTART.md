# Quick Start Guide - Backend Setup

## What Was Created

✅ **server.js** - Express backend server with two API endpoints
✅ **.env** - Environment configuration file  
✅ **package.json** - Updated with backend dependencies
✅ **BACKEND_SETUP.md** - Comprehensive documentation

## Quick Setup (3 Steps)

### Step 1: Add Your OpenAI API Key
Edit `.env` file and replace `sk-your-key-here` with your actual OpenAI API key:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

Get your key: https://platform.openai.com/api-keys

### Step 2: Verify Installation
Check that all dependencies installed successfully:
```bash
npm install
```

### Step 3: Start Backend
```bash
npm run server
```

You should see:
```
Resume Optimizer Backend running on port 5000
Make sure OPENAI_API_KEY is set in .env file
```

## What the Backend Does

### Endpoint 1: POST /api/resume/analyze
- Receives: PDF file
- Returns: Resume insights + extracted text
- Uses: OpenAI gpt-4o (vision)

### Endpoint 2: POST /api/resume/enhance
- Receives: Resume text + job role + industry + job description
- Returns: Enhanced resume text
- Uses: OpenAI gpt-3.5-turbo (cost-effective)

## Running Everything Together

For development (frontend + backend simultaneously):
```bash
npm run dev
```

This runs:
- Frontend on: `http://localhost:9001`
- Backend on: `http://localhost:5000`

## Testing the Backend

Once running, test the endpoints:

### Test Enhance Endpoint
```bash
curl -X POST http://localhost:5000/api/resume/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "John Doe\nSoftware Engineer with 5 years experience",
    "job_role": "Senior Python Developer",
    "industry": "FinTech",
    "job_description": "Looking for Python expert in cloud"
  }'
```

Expected response:
```json
{
  "enhanced_text": "Enhanced resume text here..."
}
```

## Important Notes

⚠️ **OpenAI Costs**
- Each resume analysis: ~$0.01-0.05 (gpt-4o vision)
- Each enhancement: ~$0.001-0.005 (gpt-3.5-turbo)
- Monitor your usage at: https://platform.openai.com/usage

⚠️ **API Key Security**
- NEVER commit `.env` file with real key to git
- Keep `.env` in `.gitignore` (it already is)
- Use only server-side for API calls

## Troubleshooting

### "OPENAI_API_KEY is not set"
- Make sure `.env` file exists and has the key
- Restart backend after editing `.env`

### "Port 5000 already in use"
Change PORT in `.env`:
```
PORT=3000
```

### "Cannot find module"
```bash
npm install
```

### Backend crashes on PDF upload
- Check file size (25MB limit)
- Ensure it's a valid PDF
- Check OpenAI API key has gpt-4o access

## Next Steps

1. ✅ Set up `.env` with OpenAI key
2. ✅ Run `npm run server`
3. ✅ Test endpoints with curl/Postman
4. ✅ Run `npm run dev` for full app testing
5. ✅ Upload resume PDF and verify analysis works
6. ✅ Test resume enhancement

---

For full documentation, see **BACKEND_SETUP.md**
