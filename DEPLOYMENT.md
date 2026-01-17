# Deployment Guide

Deploy your Resume Optimizer add-on to production.

## Pre-Deployment Checklist

- [ ] All dependencies installed: `npm install`
- [ ] `.env` file created with OPENAI_API_KEY
- [ ] Backend tested locally: `npm run server`
- [ ] Frontend builds successfully: `npm run build`
- [ ] API endpoints respond correctly (see API_EXAMPLES.md)
- [ ] No secrets in code (only in .env)
- [ ] OpenAI API key has sufficient quota
- [ ] Error handling tested with invalid inputs

## Part 1: Deploy Backend

Choose your hosting platform:

### Option A: Heroku (Free Tier Available)

1. **Install Heroku CLI**
   ```bash
   # From https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**
   ```bash
   heroku login
   heroku create my-resume-optimizer-backend
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set OPENAI_API_KEY=sk-your-key-here
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main  # or master
   ```

5. **Verify**
   ```bash
   heroku logs --tail
   # Should see: "Resume Optimizer Backend running on port"
   ```

6. **Get Backend URL**
   ```bash
   # https://my-resume-optimizer-backend.herokuapp.com
   ```

### Option B: Vercel (Recommended for Node.js)

1. **Sign up at vercel.com**

2. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ],
     "env": {
       "OPENAI_API_KEY": "@openai_api_key"
     }
   }
   ```

4. **Deploy**
   ```bash
   vercel
   # Follow prompts
   ```

5. **Set Secrets**
   ```bash
   vercel secrets add openai_api_key sk-your-key-here
   ```

6. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option C: AWS Lambda + API Gateway

1. **Install SAM CLI or Serverless Framework**

2. **Package backend for Lambda**
   ```bash
   zip -r function.zip server.js node_modules .env
   ```

3. **Create Lambda function**
   - Runtime: Node.js 18.x
   - Upload: function.zip
   - Handler: server.handler
   - Environment: OPENAI_API_KEY

4. **Create API Gateway**
   - Create REST API
   - Create resource: /api/resume/*
   - Link to Lambda function
   - CORS enabled

### Option D: Google Cloud Run

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-slim
   WORKDIR /app
   COPY . .
   RUN npm install
   EXPOSE 5000
   CMD ["npm", "run", "server"]
   ```

2. **Deploy**
   ```bash
   gcloud run deploy resume-optimizer \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars OPENAI_API_KEY=sk-your-key
   ```

### Option E: Azure App Service

1. **Create App Service**
   - Runtime: Node.js 18
   - OS: Linux

2. **Set Configuration**
   - Go to Settings → Configuration
   - Add: OPENAI_API_KEY

3. **Deploy via Git or ZIP**
   ```bash
   az webapp up --name my-resume-optimizer --runtime "node|18"
   ```

## Part 2: Update Frontend for Backend URL

Edit `src/components/App.tsx`:

### If backend on same domain (e.g., heroku subpath):
Change:
```typescript
const response = await fetch("/api/resume/analyze", {
```
To:
```typescript
const response = await fetch("https://my-backend.herokuapp.com/api/resume/analyze", {
```

### If backend on different domain:
Add CORS handling in backend `server.js`:
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'https://express.adobe.com',
    'https://my-frontend-domain.com',
    'http://localhost:9001'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
```

Install CORS:
```bash
npm install cors
```

## Part 3: Deploy Frontend to Adobe

### Build for Production
```bash
npm run build
```

### Package for Adobe
```bash
npm run package
```

### Upload to Adobe Developer Console
1. Go to https://developer.adobe.com/console
2. Select your project
3. Upload the packaged add-on (dist folder)
4. Submit for review

## Part 4: Monitor & Maintain

### Monitor Backend Performance
```bash
# Heroku
heroku logs --tail --app my-resume-optimizer-backend

# Vercel
vercel logs

# Google Cloud Run
gcloud run logs read resume-optimizer
```

### Monitor Costs
```
OpenAI Dashboard: https://platform.openai.com/account/usage
```

Set up alerts:
- Heroku: Monitoring dashboard
- Vercel: Analytics page
- AWS: CloudWatch
- Google Cloud: Cloud Monitoring

### Handle Errors

**Scenario: Backend down**
- Frontend shows: "Error: Unable to analyze resume"
- Check: Backend logs, OpenAI status, network

**Scenario: Rate limited**
- Add retry logic in backend:
```javascript
const maxRetries = 3;
let lastError;
for (let i = 0; i < maxRetries; i++) {
  try {
    return await fetch(openaiUrl, options);
  } catch (e) {
    lastError = e;
    await new Promise(r => setTimeout(r, (i + 1) * 2000)); // Exponential backoff
  }
}
throw lastError;
```

**Scenario: High costs**
- Add request limits:
```javascript
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // 100 requests per window
}));
```

## Environment Configuration

### Development
```
NODE_ENV=development
OPENAI_API_KEY=sk-...
PORT=5000
DEBUG=true
```

### Staging
```
NODE_ENV=staging
OPENAI_API_KEY=sk-... (test key)
PORT=3000
DEBUG=false
```

### Production
```
NODE_ENV=production
OPENAI_API_KEY=sk-... (prod key)
PORT=80 or 443
DEBUG=false
CORS_ORIGINS=https://express.adobe.com
```

## Security in Production

### Secrets Management

**Heroku:**
```bash
heroku config:set OPENAI_API_KEY=sk-...
```

**Vercel:**
```bash
vercel secrets add openai_api_key sk-...
```

**AWS:**
- Use Secrets Manager
- Use IAM roles

**Google Cloud:**
- Use Secret Manager
- Use Cloud Build for secrets

**Azure:**
- Use Key Vault
- Use Managed Identity

### API Security

Add authentication if needed:
```javascript
// Optional: API key requirement
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use(limiter);
```

### Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.post("/api/resume/analyze", ..., (req, res) => {
  try {
    // ...
    logger.info('Resume analyzed successfully');
  } catch (err) {
    logger.error('Analysis failed', err);
  }
});
```

## Scaling Tips

### Database (Optional)
If you want to store results:
```bash
npm install mongodb
# or
npm install pg
```

### Caching (Optional)
```bash
npm install redis
# or
npm install node-cache
```

### Load Balancing
- Use load balancer in front of multiple backend instances
- Monitor CPU/memory usage
- Scale horizontally as needed

## Rollback Plan

If something breaks:

1. **Heroku:**
   ```bash
   heroku releases
   heroku rollback v123
   ```

2. **Vercel:**
   Go to Deployments → Click previous version → Promote

3. **AWS:**
   Use Code Deploy for easy rollback

4. **Google Cloud:**
   ```bash
   gcloud run deploy resume-optimizer --image gcr.io/[previous-version]
   ```

## Testing After Deployment

1. **Test Enhance Endpoint**
   ```bash
   curl -X POST https://your-backend.com/api/resume/enhance \
     -H "Content-Type: application/json" \
     -d '{"resume_text":"...", ...}'
   ```

2. **Test Analytics**
   - Upload 5-10 resumes
   - Monitor: Performance, errors, costs

3. **Test Frontend**
   - Load Adobe Express add-on
   - Upload PDF
   - Enhance resume
   - Check variant generation

## Post-Deployment

### Monitor
- Daily: Error logs
- Weekly: Cost dashboard
- Monthly: Performance metrics

### Update
- Patch Node.js monthly
- Update dependencies: `npm update`
- Review OpenAI API updates

### Backup
- Regular database backups (if using)
- Version control all code
- Archive old deployments

---

**Deployment Complete!** 🚀

Your Resume Optimizer is now live and ready for users.

For support, check:
- Backend logs
- OpenAI status page
- Provider documentation
