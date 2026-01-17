# API Examples & Testing Guide

## How to Test Endpoints

### Prerequisites
- Backend running: `npm run server` (on port 5000)
- OpenAI API key in `.env`

## Using curl (Command Line)

### Test 1: Enhance Resume (No PDF Required)

```bash
curl -X POST http://localhost:5000/api/resume/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "John Smith\nSoftware Engineer\n\nExperience:\n- Worked on backend systems\n- 5 years total experience\n- Used Python and Java",
    "job_role": "Senior Python Developer",
    "industry": "FinTech",
    "job_description": "Looking for a senior Python developer with experience in financial systems and cloud infrastructure"
  }'
```

**Expected Response (200 OK):**
```json
{
  "enhanced_text": "John Smith\nSenior Software Engineer with 5+ years in backend development...[enhanced text]"
}
```

### Test 2: Analyze Resume PDF

You need an actual PDF file. Create one or use an existing resume.

```bash
# Windows PowerShell
$filePath = "C:\path\to\resume.pdf"
$form = @{
  resume = Get-Item -Path $filePath
}

Invoke-RestMethod -Uri "http://localhost:5000/api/resume/analyze" `
  -Method Post `
  -Form $form
```

Or using curl (if you have a resume.pdf in current directory):
```bash
curl -X POST http://localhost:5000/api/resume/analyze \
  -F "resume=@resume.pdf"
```

**Expected Response (200 OK):**
```json
{
  "insights": "Skills: Python, AWS, System Design\nExperience Level: Senior\nATS Improvements:\n- Add more quantified metrics\n- Use standard resume section headers\n- Include specific technologies",
  "extracted_text": "Resume analyzed. Ready to enhance..."
}
```

## Using Postman (GUI)

### Setup
1. Open Postman
2. Create new request

### Request 1: Enhance Resume

**Type:** POST  
**URL:** `http://localhost:5000/api/resume/enhance`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "resume_text": "Jane Doe\nProduct Manager\n\nExperience:\n- Led product roadmap\n- 3 years at tech startup\n- Increased user retention by 40%",
  "job_role": "Senior Product Manager",
  "industry": "SaaS",
  "job_description": "We need a senior PM to drive product strategy, with experience in B2B SaaS and metrics-driven decisions"
}
```

**Send** → View response

### Request 2: Analyze PDF

**Type:** POST  
**URL:** `http://localhost:5000/api/resume/analyze`

**Headers:** (Auto-set by Postman for multipart)

**Body:**
- Select: `form-data`
- Key: `resume` (type: File)
- Value: Select your PDF file

**Send** → View response

## Using Node.js/JavaScript

### Test with node-fetch

```javascript
// test-backend.js

// Test 1: Enhance Resume
async function testEnhance() {
    const response = await fetch("http://localhost:5000/api/resume/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            resume_text: "John Developer\nSoftware Engineer\n\n5 years experience with Python",
            job_role: "Senior Backend Engineer",
            industry: "Cloud Computing",
            job_description: "Need backend expert in microservices"
        })
    });

    const data = await response.json();
    console.log("Enhanced Resume:");
    console.log(data.enhanced_text);
}

// Test 2: Analyze PDF
async function testAnalyze() {
    const fs = require("fs");
    const FormData = require("form-data");

    const form = new FormData();
    form.append("resume", fs.createReadStream("resume.pdf"));

    const response = await fetch("http://localhost:5000/api/resume/analyze", {
        method: "POST",
        body: form,
        headers: form.getHeaders()
    });

    const data = await response.json();
    console.log("Insights:");
    console.log(data.insights);
}

// Run tests
testEnhance().catch(console.error);
```

Run with:
```bash
node test-backend.js
```

## Using Python

```python
# test_backend.py
import requests
import json

BASE_URL = "http://localhost:5000"

# Test 1: Enhance Resume
def test_enhance():
    url = f"{BASE_URL}/api/resume/enhance"
    
    payload = {
        "resume_text": "Jane Dev\nData Scientist\n\n4 years ML experience",
        "job_role": "Senior Machine Learning Engineer",
        "industry": "AI/ML",
        "job_description": "Looking for ML expert in LLMs and NLP"
    }
    
    response = requests.post(url, json=payload)
    print("Status:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))

# Test 2: Analyze PDF
def test_analyze():
    url = f"{BASE_URL}/api/resume/analyze"
    
    with open("resume.pdf", "rb") as f:
        files = {"resume": f}
        response = requests.post(url, files=files)
    
    print("Status:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    print("=== Testing Enhance ===")
    test_enhance()
    
    print("\n=== Testing Analyze ===")
    # test_analyze()  # Uncomment if you have resume.pdf
```

Run with:
```bash
python test_backend.py
```

## Error Handling Examples

### Error: Missing OpenAI Key
```json
{
  "error": "OpenAI error: 401 Unauthorized - Invalid API key"
}
```

**Fix:** Add valid key to `.env`

### Error: Invalid JSON
```json
{
  "error": "Unexpected token } in JSON at position 123"
}
```

**Fix:** Validate JSON syntax

### Error: Missing Required Field
```json
{
  "error": "Resume text required"
}
```

**Fix:** Ensure all required fields are provided

### Error: File Upload Failed
```json
{
  "error": "No file uploaded"
}
```

**Fix:** Ensure multipart form has `resume` field with file

### Error: API Rate Limit
```json
{
  "error": "OpenAI error: 429 Too Many Requests - Rate limit exceeded"
}
```

**Fix:** Wait and retry, or reduce request frequency

## Response Formats

### Successful Analysis Response

```json
{
  "insights": "Key Skills: Python, AWS Lambda, DynamoDB\nExperience Level: Mid\nATS Improvements:\n- Add more action verbs\n- Include specific metrics (increased X by Y%)\n- Use standard section headers (EXPERIENCE, SKILLS, EDUCATION)",
  "extracted_text": "Resume analyzed. Ready to enhance..."
}
```

### Successful Enhancement Response

```json
{
  "enhanced_text": "JANE SMITH\nSenior Software Engineer | jansmith@email.com | LinkedIn.com/in/janesmith\n\nPROFESSIONAL SUMMARY\nExperienced Senior Software Engineer with 7+ years developing scalable backend systems for Fortune 500 companies. Expert in Python, AWS, and microservices architecture. Track record of improving system performance by 40% and reducing infrastructure costs by 35%.\n\nKEY SKILLS\nLanguages: Python, Go, SQL\nCloud: AWS (Lambda, DynamoDB, EC2, RDS), Google Cloud\nFull Stack: REST APIs, GraphQL, Microservices\nDatabases: PostgreSQL, MongoDB, DynamoDB\nTools: Docker, Kubernetes, Terraform, Git\n\nPROFESSIONAL EXPERIENCE\n...[rest of enhanced resume]"
}
```

### Error Response

```json
{
  "error": "Failed to enhance: OpenAI rate limit exceeded"
}
```

HTTP Status: 500

## Testing Checklist

- [ ] Backend running on port 5000
- [ ] `.env` has valid OPENAI_API_KEY
- [ ] Test enhance endpoint with sample text
- [ ] Test analyze endpoint with PDF file
- [ ] Verify response JSON format
- [ ] Check error handling with invalid input
- [ ] Monitor OpenAI API usage dashboard
- [ ] Verify response time (should be 2-5 seconds)

## Performance Benchmarks

| Operation | Time | Cost |
|-----------|------|------|
| Analyze PDF (gpt-4o) | 3-5s | $0.01-0.05 |
| Enhance Resume (gpt-3.5) | 2-3s | $0.001-0.005 |
| Variant Generation (client) | <1s | $0.00 |

## Monitoring & Debugging

### Check Backend Logs
```bash
# See what the backend is doing
npm run server
# Watch console for errors and requests
```

### Monitor OpenAI Usage
```
https://platform.openai.com/account/usage/overview
```

### Check Response Times
Browser DevTools → Network tab → See request duration

### Enable Verbose Logging
Edit server.js and add:
```javascript
// After each fetch to OpenAI:
console.log("OpenAI Request:", { model, tokens, cost });
console.log("OpenAI Response Time:", response.timing);
```

---

**Ready to test?** Start with the curl examples above!
