# Quick Start Guide

Get Engineering CAD AI running in 5 minutes!

## Prerequisites

✅ Install these first:
- [Node.js 18+](https://nodejs.org/) and npm
- [Python 3.11+](https://www.python.org/)
- [AWS CLI](https://aws.amazon.com/cli/) (configured with credentials)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

```bash
# Install AWS SAM CLI (macOS)
brew install aws-sam-cli

# Or with pip
pip install aws-sam-cli

# Verify installations
node --version  # Should be 18+
python --version  # Should be 3.11+
sam --version  # Should be 1.x+
aws --version  # Should be 2.x+
```

## Option A: Test Locally (Fastest)

Test the app locally without deploying to AWS first:

```bash
# 1. Navigate to project
cd /Users/reddy/engineering-cad-ai

# 2. Run the test script
./test-local.sh

# Script will:
# - Install frontend dependencies
# - Check for Claude API key
# - Start dev server on http://localhost:3000

# 3. Open browser to http://localhost:3000

# 4. Try an example:
# "Design a simply supported beam 5 meters long with a 10kN point load at center"
```

**Note:** Local mode calls Claude API directly from Next.js (slower but works for testing).

## Option B: Full Deployment (Production)

Deploy both backend and frontend for full production setup:

### Step 1: Deploy Backend to AWS

```bash
cd /Users/reddy/engineering-cad-ai/backend

# Build
sam build

# Deploy (follow prompts)
sam deploy --guided

# When prompted:
# - Stack name: engineering-cad-ai-backend
# - AWS Region: us-east-2 (or your preferred region)
# - Parameter ClaudeApiKey: your_claude_api_key_here
# - Confirm changes: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments: Y

# ⚠️ IMPORTANT: Save the ApiEndpoint from output!
# It looks like: https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod/
```

### Step 2: Configure Frontend

```bash
cd /Users/reddy/engineering-cad-ai/frontend

# Edit .env.local and update LAMBDA_API_ENDPOINT with your API Gateway URL
# LAMBDA_API_ENDPOINT=https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod
```

### Step 3: Test Frontend Locally with AWS Backend

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

### Step 4: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Set environment variables in Vercel:
# Go to dashboard → Settings → Environment Variables
# Add: LAMBDA_API_ENDPOINT = https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod

# Deploy to production
vercel --prod
```

## Automated Deployment Script

We also provide an automated deployment script:

```bash
cd /Users/reddy/engineering-cad-ai

# Run deployment script
./deploy.sh

# This will:
# 1. Check prerequisites
# 2. Deploy backend to AWS
# 3. Setup frontend
# 4. Update .env.local automatically
# 5. Build frontend
```

## Test the Application

Once running, try these example prompts:

### 1. Simple Beam
```
Design a simply supported beam 5 meters long with a 10kN point load at center
```

### 2. Plate with Holes
```
Create a rectangular steel plate 200mm x 150mm with 4 mounting holes, 
one in each corner, 10mm diameter, 20mm from edges
```

### 3. Cantilever Beam
```
Draw a cantilever beam 3 meters long, fixed at left end, 
with uniform distributed load of 5 kN/m
```

### 4. Complex Structure
```
Design a truss bridge with 6 panels, each 2 meters wide, 
with vertical and diagonal members
```

## Architecture Overview

```
User Browser (http://localhost:3000)
         ↓
    Next.js Frontend (React + TypeScript)
         ↓
    API Routes (/api/claude, /api/execute-dxf)
         ↓
    AWS Lambda (Python + ezdxf) ← OR → Claude API Direct (local mode)
         ↓
    DXF File Generated
```

## Workflow

1. **User describes** engineering problem in chat
2. **Claude analyzes** requirements (may ask clarifying questions)
3. **Claude generates** Python ezdxf code
4. **Lambda executes** code to create DXF
5. **Error recovery**: If errors, Claude fixes and retries (up to 3 times)
6. **DXF displayed** and available for download

## Monitoring

### View Backend Logs

```bash
cd /Users/reddy/engineering-cad-ai/backend

# DXF Executor logs
sam logs -n DxfExecutorFunction --tail

# Claude Proxy logs
sam logs -n ClaudeProxyFunction --tail
```

### Check Frontend Logs

Check browser console (F12 → Console) for frontend errors.

## Troubleshooting

### "Lambda endpoint not configured"
- Ensure `LAMBDA_API_ENDPOINT` is set in `frontend/.env.local`
- Or leave empty for local dev mode (uses Claude API directly)

### "Failed to call Claude API"
- Verify `CLAUDE_API_KEY` is correct in `.env.local`
- Check API key has not expired

### Backend deployment fails
- Ensure AWS CLI is configured: `aws configure`
- Check you have sufficient AWS permissions
- Verify Python 3.11 is installed

### Frontend won't start
- Delete `node_modules` and run `npm install` again
- Check Node.js version: `node --version` (should be 18+)
- Clear Next.js cache: `rm -rf .next`

### DXF generation fails
- Check Lambda logs: `sam logs -n DxfExecutorFunction --tail`
- Verify ezdxf is installed in Lambda
- Check Lambda memory (should be 2048 MB)

## File Structure

```
engineering-cad-ai/
├── frontend/           # Next.js app
│   ├── app/           # Pages and API routes
│   ├── components/    # React components
│   ├── lib/           # Templates and constants
│   └── .env.local     # ← Configure this!
│
├── backend/           # AWS Lambda
│   ├── lambda/
│   │   ├── dxf_executor/    # DXF generation
│   │   └── claude_proxy/    # Claude API proxy
│   └── template.yaml        # SAM template
│
├── deploy.sh          # Automated deployment
├── test-local.sh      # Local testing
└── README.md          # Full documentation
```

## Next Steps

1. **Test locally** with `./test-local.sh`
2. **Deploy to AWS** with `sam deploy --guided`
3. **Deploy to Vercel** with `vercel --prod`
4. **Monitor** with CloudWatch and logs
5. **Iterate** based on usage

## Support

- **Backend Issues**: Check `backend/README.md`
- **Frontend Issues**: Check `frontend/README.md`
- **Architecture**: Check main `README.md`

---

**Ready to build?** Run `./test-local.sh` now! 🚀

