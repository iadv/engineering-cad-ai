# Engineering CAD AI

Production-grade web application for AI-powered engineering analysis and CAD generation using Claude AI and AWS Lambda.

## 🎯 Features

- **AI Engineering Analysis** - Claude Sonnet 4 analyzes engineering problems
- **Automated Python Code Generation** - Generates `ezdxf` Python code for CAD drawings
- **AWS Lambda Execution** - Executes Python code securely on AWS infrastructure
- **2D DXF Viewer** - Canvas-based viewer with proper CAD rendering
- **Error Recovery** - Automatic retry with code fixing (up to 3 attempts)
- **Interactive Chat** - Iterative design refinement through conversation
- **Code Editing** - Monaco editor for manual Python code tweaking
- **Download Support** - Export DXF files for AutoCAD/LibreCAD

## 🏗️ Architecture

```
Frontend (Vercel - Next.js)
    ↓
    ├─► Claude API (Direct) - Analysis & Code Generation
    └─► AWS Lambda - DXF Execution (Python + ezdxf)
```

## 📦 Tech Stack

### Frontend
- **Framework:** Next.js 14 (React, TypeScript)
- **AI Integration:** Anthropic Claude API
- **Code Editor:** Monaco Editor
- **DXF Rendering:** HTML5 Canvas 2D
- **Hosting:** Vercel

### Backend
- **Runtime:** AWS Lambda (Python 3.11)
- **CAD Library:** ezdxf 1.3.0
- **Deployment:** AWS SAM (Serverless Application Model)
- **API:** API Gateway

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Start

1. **Backend (AWS Lambda):**
   ```bash
   cd backend
   sam build --use-container
   sam deploy
   ```

2. **Frontend (Vercel):**
   - Push to GitHub
   - Import to Vercel
   - Set Root Directory: `frontend`
   - Add environment variables:
     - `CLAUDE_API_KEY`
     - `LAMBDA_API_ENDPOINT`

## 🔧 Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (local testing)
cd backend
sam local start-api
```

## 📁 Project Structure

```
engineering-cad-ai/
├── frontend/              # Next.js application
│   ├── app/
│   │   ├── api/          # API routes
│   │   │   ├── claude/   # Claude API proxy
│   │   │   └── execute-dxf/  # DXF execution
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── EngineeringCAD.tsx  # Main component
│   │   └── DXFViewer.tsx       # Canvas 2D renderer
│   └── lib/
│       └── constants.ts         # Templates & prompts
│
├── backend/              # AWS Lambda functions
│   ├── lambda/
│   │   ├── dxf_executor/       # Python + ezdxf execution
│   │   └── claude_proxy/       # (Optional) Claude proxy
│   ├── template.yaml           # SAM template
│   └── samconfig.toml          # SAM configuration
│
└── DEPLOYMENT.md         # Deployment guide
```

## 🔑 Environment Variables

### Frontend (.env.local)
```bash
CLAUDE_API_KEY=your_claude_api_key
LAMBDA_API_ENDPOINT=your_lambda_endpoint
```

### Backend (AWS)
Configured via SAM parameters during deployment.

## 📝 Usage

1. **Describe Your Engineering Problem**
   - Enter requirements in the chat
   - Claude analyzes and provides engineering analysis

2. **Review Generated Python Code**
   - Automatically generates `ezdxf` Python code
   - Edit code in Monaco editor if needed

3. **Execute on AWS Lambda**
   - Code runs securely on AWS infrastructure
   - Automatic error recovery with fixes

4. **View DXF Drawing**
   - 2D canvas viewer with proper CAD colors
   - Download DXF for AutoCAD/LibreCAD

5. **Iterate**
   - Continue conversation to refine design
   - Regenerate with new requirements

## 🛡️ Security

- ✅ API keys stored as environment variables
- ✅ No sensitive data in repository
- ✅ CORS configured for API endpoints
- ✅ Secure Lambda execution environment

## 📄 License

Private - Production Application

## 🤝 Support

For issues or questions, refer to:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [Backend README](./backend/README.md) - Backend details

---

**Status:** ✅ Production Ready

**Last Updated:** October 2025
