# Engineering CAD AI - Frontend

Production-grade Next.js frontend for AI-powered engineering CAD generation.

## Features

- 🤖 **AI Chat Interface**: Conversational engineering problem analysis
- 💻 **Live Code Editor**: Edit Python ezdxf code in real-time
- 📐 **DXF Generation**: Production-grade CAD file generation
- 🔄 **Error Recovery**: Automatic code fixing with feedback loops
- ⚡ **Real-time Updates**: See generation status and logs
- 📥 **DXF Download**: Export to AutoCAD-compatible format

## Prerequisites

- Node.js 18+ and npm
- Backend Lambda deployed (or run locally with Claude API)

## Local Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
- Set `CLAUDE_API_KEY` (required for local dev)
- Leave `LAMBDA_API_ENDPOINT` empty (will use Claude API directly)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Test the Application

Try these example prompts:
- "Design a simply supported beam 5 meters long with a 10kN point load at center"
- "Create a rectangular steel plate 200mm x 150mm with 4 mounting holes"
- "Draw a cantilever beam with dimensions and load diagram"

## Integration with Backend

Once you deploy the backend Lambda:

1. Get the API Gateway endpoint:
```bash
cd ../backend
sam deploy
# Copy the ApiEndpoint from outputs
```

2. Update `.env.local`:
```
LAMBDA_API_ENDPOINT=https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod
```

3. Restart dev server:
```bash
npm run dev
```

## Building for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - LAMBDA_API_ENDPOINT
# - CLAUDE_API_KEY (optional, for fallback)

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/engineering-cad-ai.git
git push -u origin main
```

2. Connect to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variables:
     - `LAMBDA_API_ENDPOINT`: Your Lambda API endpoint
     - `CLAUDE_API_KEY`: Your Claude API key (optional)
   - Deploy

3. Vercel will auto-deploy on every push to main

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── claude/route.ts          # Claude API proxy
│   │   └── execute-dxf/route.ts     # DXF execution proxy
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Home page
├── components/
│   └── EngineeringCAD.tsx          # Main application component
├── lib/
│   └── constants.ts                 # Python template & prompts
├── .env.local                       # Environment variables (local)
├── next.config.js                   # Next.js configuration
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

## Architecture

### Chat Flow
1. User describes engineering problem
2. Claude analyzes and asks clarifying questions (if needed)
3. Claude generates Python ezdxf code
4. Code is executed on AWS Lambda
5. If errors occur, automatic retry with code fixes (up to 3 attempts)
6. DXF file is generated and displayed

### Error Recovery
- Automatic code error detection
- Claude fixes errors based on stack traces
- Up to 3 retry attempts
- Detailed execution logs

### Code Editor
- Syntax highlighting for Python
- Users can edit generated code
- Manual regeneration on demand
- Real-time preview

## API Routes

### POST /api/claude
Proxy for Claude API calls.

### POST /api/execute-dxf
Execute DXF generation code on Lambda.

## Environment Variables

### Required (Production)
- `LAMBDA_API_ENDPOINT`: AWS Lambda API Gateway endpoint

### Optional (Local Development)
- `CLAUDE_API_KEY`: Anthropic Claude API key (for local dev without Lambda)

## Troubleshooting

### "Lambda endpoint not configured"
- Ensure `LAMBDA_API_ENDPOINT` is set in environment variables
- For local dev without Lambda, set `CLAUDE_API_KEY` instead

### Code execution fails
- Check Lambda logs: `sam logs -n DxfExecutorFunction --tail`
- Verify Lambda has enough memory (2048 MB recommended)
- Check Lambda timeout (300s recommended)

### Chat not responding
- Verify Claude API key is valid
- Check browser console for errors
- Ensure backend is deployed and accessible

## Performance

- Cold start: 2-5 seconds (first Lambda invocation)
- Warm execution: 500ms - 2s
- Code generation: 5-15 seconds (depends on complexity)
- Average total time: 10-20 seconds

## Security

- API keys stored in environment variables
- Claude API proxied through Next.js/Lambda
- No client-side API key exposure
- CORS configured for production domains

## License

Proprietary - All rights reserved

