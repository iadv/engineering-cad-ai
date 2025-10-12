# Local Development Guide

Complete guide for developing and testing **Engineering CAD AI** locally.

---

## 🚀 Quick Start

```bash
# From the project root
./start-local.sh
```

That's it! Your app will be running at **http://localhost:3000**

---

## 📋 What Runs Locally

### ✅ Frontend (Next.js)
- **Runs:** Locally on your machine
- **Port:** http://localhost:3000
- **Hot Reload:** Yes - changes appear instantly
- **Environment:** Development mode

### ✅ Claude API
- **Runs:** Direct calls to Anthropic API
- **No local setup needed**
- Uses your API key from `.env.local`

### ✅ Backend (AWS Lambda)
- **Runs:** On AWS (already deployed)
- **Endpoint:** Your production Lambda
- **No local Lambda needed** - it's fast enough!

---

## 🔧 Environment Setup

### Automatic Setup
The `start-local.sh` script automatically creates `frontend/.env.local` with:

```bash
CLAUDE_API_KEY=your_key_here
LAMBDA_API_ENDPOINT=https://your-lambda-endpoint.amazonaws.com/Prod
```

### Manual Setup
If you want to edit environment variables:

```bash
# Edit the file
nano frontend/.env.local

# Or use any text editor
code frontend/.env.local
```

---

## 🎯 Development Workflow

### 1. Start Development Server
```bash
./start-local.sh
```

### 2. Make Changes
Edit any file in `frontend/`:
- **Components:** `frontend/components/`
- **Pages:** `frontend/app/`
- **API Routes:** `frontend/app/api/`
- **Constants/Prompts:** `frontend/lib/constants.ts`

### 3. Test Changes
- **Frontend changes:** Appear instantly (hot reload)
- **API route changes:** Require page refresh
- **Backend changes:** Need Lambda redeployment (see below)

### 4. Stop Server
Press `Ctrl+C` in the terminal

---

## 🔄 Common Iterations

### Change UI/Components
```bash
# Edit any component
nano frontend/components/EngineeringCAD.tsx

# Changes appear immediately in browser
```

### Change Claude Prompts
```bash
# Edit system prompts
nano frontend/lib/constants.ts

# Refresh page to test
```

### Change Python Template
```bash
# Edit DXF template
nano frontend/lib/constants.ts

# Find PYTHON_TEMPLATE constant
# Refresh page to test
```

### Change API Logic
```bash
# Edit API routes
nano frontend/app/api/claude/route.ts
nano frontend/app/api/execute-dxf/route.ts

# Refresh page to test
```

---

## 🐛 Testing & Debugging

### View Logs
**Frontend logs** (in terminal where you ran `start-local.sh`):
- HTTP requests
- API calls
- React errors
- Build warnings

**Lambda logs** (AWS):
```bash
# View recent Lambda logs
aws logs tail /aws/lambda/engineering-cad-ai-backend-DxfExecutorFunction-F22clTHi98V5 \
  --since 10m \
  --follow \
  --region us-east-2
```

### Debug Claude API
Add console.logs in:
```typescript
// frontend/app/api/claude/route.ts
console.log('Claude request:', body);
console.log('Claude response:', message);
```

### Debug DXF Execution
Add console.logs in:
```typescript
// frontend/app/api/execute-dxf/route.ts
console.log('DXF request:', code);
console.log('DXF response:', result);
```

### Debug Frontend
Use browser DevTools:
- **F12** or **Cmd+Option+I**
- **Console tab** for logs
- **Network tab** for API calls
- **React DevTools** for component inspection

---

## 🔄 Update Lambda Backend

If you need to change the Python backend:

```bash
cd backend

# Make changes to Lambda code
nano lambda/dxf_executor/handler.py
nano lambda/dxf_executor/ezdxf_engine.py

# Rebuild and redeploy
sam build --use-container
sam deploy

# Test immediately (no restart needed)
```

---

## 📦 Install New Dependencies

### Frontend Dependencies
```bash
cd frontend
npm install package-name
cd ..

# Restart dev server
./start-local.sh
```

### Backend Dependencies
```bash
cd backend/lambda/dxf_executor
echo "new-package==1.0.0" >> requirements.txt
cd ../../..

# Redeploy Lambda
cd backend
sam build --use-container
sam deploy
```

---

## 🧹 Clean Restart

If something goes wrong:

```bash
# Stop all dev servers
pkill -f "next dev"

# Clean Next.js cache
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache

# Reinstall dependencies
cd frontend
npm install
cd ..

# Start fresh
./start-local.sh
```

---

## 🎨 UI Iteration Tips

### Fast UI Changes
1. Edit `frontend/components/EngineeringCAD.tsx`
2. Save file
3. Browser auto-refreshes
4. See changes immediately

### CSS Changes
1. Edit `frontend/app/globals.css`
2. Changes appear instantly
3. No refresh needed

### Add New Components
```bash
# Create new component
nano frontend/components/NewComponent.tsx

# Import in main component
# Edit frontend/components/EngineeringCAD.tsx
# Add: import NewComponent from './NewComponent'
```

---

## 🚀 Deploy Changes

When ready to deploy your changes:

```bash
# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push

# Vercel auto-deploys!
# Check: https://vercel.com/iadv/engineering-cad-ai
```

---

## 📊 Performance Testing

### Test Claude Response Time
```bash
# In browser console
console.time('claude');
// Make a request
console.timeEnd('claude');
```

### Test Lambda Execution
```bash
# In browser console
console.time('lambda');
// Execute DXF
console.timeEnd('lambda');
```

### Test DXF Rendering
```bash
# In browser console
console.time('render');
// Download DXF
console.timeEnd('render');
```

---

## 🔑 Environment Variables Reference

### Local Development
```bash
# frontend/.env.local
CLAUDE_API_KEY=your_claude_key
LAMBDA_API_ENDPOINT=https://your-lambda.execute-api.region.amazonaws.com/Prod
```

### Production (Vercel)
Same variables, set in Vercel dashboard

### Backend (Lambda)
Set during SAM deployment

---

## 📝 Common Tasks

### Change Drawing Template
```bash
# Edit the template
nano frontend/lib/constants.ts

# Find: export const PYTHON_TEMPLATE
# Modify the template string
# Save and refresh browser
```

### Change Claude Instructions
```bash
# Edit system prompts
nano frontend/lib/constants.ts

# Find: export const SYSTEM_PROMPT_CODE_GEN
# Modify the prompt
# Save and test
```

### Add New DXF Entity Type
```bash
# Edit DXF viewer
nano frontend/components/DXFViewer.tsx

# Add new entity type in parseDXFContent()
# Test with appropriate drawing
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use the script (it does this automatically)
./start-local.sh
```

### Lambda Not Working
```bash
# Test Lambda directly
curl -X POST https://your-lambda.execute-api.region.amazonaws.com/Prod/execute-dxf \
  -H "Content-Type: application/json" \
  -d '{"code":"import ezdxf\ndoc = ezdxf.new()\nprint(doc)"}'
```

### Claude API Errors
```bash
# Verify API key
cat frontend/.env.local | grep CLAUDE_API_KEY

# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🎯 Development Checklist

Before deploying changes:
- [ ] Test locally at http://localhost:3000
- [ ] Test chat with Claude
- [ ] Test Python code generation
- [ ] Test DXF execution
- [ ] Test DXF viewer rendering
- [ ] Test download functionality
- [ ] Check browser console for errors
- [ ] Check terminal logs for warnings
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test with different queries

---

## 📚 Key Files

- `frontend/components/EngineeringCAD.tsx` - Main component
- `frontend/components/DXFViewer.tsx` - DXF renderer
- `frontend/lib/constants.ts` - Templates & prompts
- `frontend/app/api/claude/route.ts` - Claude API
- `frontend/app/api/execute-dxf/route.ts` - DXF execution API
- `backend/lambda/dxf_executor/handler.py` - Lambda handler
- `backend/lambda/dxf_executor/ezdxf_engine.py` - DXF engine

---

**Happy coding!** 🚀

For questions or issues, check the main [README.md](./README.md) or [DEPLOYMENT.md](./DEPLOYMENT.md)

