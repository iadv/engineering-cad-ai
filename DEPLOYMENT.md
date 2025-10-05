# Deployment Guide

## Prerequisites

1. AWS Account with Lambda access
2. Vercel Account
3. GitHub Account
4. Claude API Key from Anthropic

---

## Step 1: Deploy Backend to AWS Lambda

The backend is already deployed! Your Lambda endpoint is:
```
https://cpmgwp4238.execute-api.us-east-2.amazonaws.com/Prod
```

If you need to redeploy:
```bash
cd backend
sam build --use-container
sam deploy
```

---

## Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Engineering CAD AI Application"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Frontend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. **Configure Project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`  ⚠️ **IMPORTANT**
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

4. **Add Environment Variables:**
   - `CLAUDE_API_KEY` = `your_claude_api_key_here`
   - `LAMBDA_API_ENDPOINT` = `https://your-lambda-endpoint.execute-api.region.amazonaws.com/Prod`

5. Click **Deploy**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Follow prompts and add environment variables when asked
```

---

## Environment Variables Reference

### Frontend (.env.local)
```
CLAUDE_API_KEY=your_claude_api_key
LAMBDA_API_ENDPOINT=your_lambda_endpoint
```

### Backend (AWS Lambda Environment)
Already configured during SAM deployment.

---

## Post-Deployment Checklist

- [ ] Frontend deployed successfully on Vercel
- [ ] Backend Lambda responding correctly
- [ ] Environment variables set in Vercel
- [ ] Test the application end-to-end
- [ ] Chat with Claude works
- [ ] Python code generation works
- [ ] DXF execution on Lambda works
- [ ] DXF viewer renders correctly
- [ ] Download DXF button works

---

## Troubleshooting

### Issue: "Lambda execution failed"
- **Check:** Is `LAMBDA_API_ENDPOINT` set correctly in Vercel?
- **Fix:** Update environment variable in Vercel dashboard → Settings → Environment Variables

### Issue: "Claude API error"
- **Check:** Is `CLAUDE_API_KEY` set correctly?
- **Fix:** Update environment variable in Vercel dashboard

### Issue: Build fails on Vercel
- **Check:** Did you set Root Directory to `frontend`?
- **Fix:** Project Settings → General → Root Directory → `frontend`

### Issue: 404 on deployment
- **Check:** Vercel is looking at the correct directory
- **Fix:** Make sure Root Directory is `frontend` and Output Directory is `.next`

---

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─────► Chat with Claude (Direct API call from Next.js)
       │
       └─────► Generate DXF
               │
               ├─────► Next.js API Route (/api/execute-dxf)
               │
               └─────► AWS Lambda (DXF Executor)
                       │
                       └─────► Execute Python + ezdxf
                               │
                               └─────► Return DXF
```

**Frontend:** Vercel (Next.js)
**Backend:** AWS Lambda (Python)
**AI:** Claude API (Anthropic)

---

## URLs

- **Frontend:** https://your-app.vercel.app (after deployment)
- **Backend:** https://cpmgwp4238.execute-api.us-east-2.amazonaws.com/Prod
- **Repo:** https://github.com/YOUR_USERNAME/YOUR_REPO_NAME

---

## Production Notes

✅ **Working:**
- Claude chat integration
- Engineering analysis
- Python code generation
- DXF execution on AWS Lambda
- 2D DXF viewer (Canvas-based)
- Download DXF functionality
- Error recovery with retries

🔒 **Security:**
- API keys stored as environment variables
- No sensitive data in repository
- CORS configured for API endpoints

📦 **Dependencies:**
- Frontend: Next.js 14, React, Monaco Editor, TypeScript
- Backend: Python 3.11, ezdxf, Anthropic SDK

---

Good luck with deployment! 🚀

