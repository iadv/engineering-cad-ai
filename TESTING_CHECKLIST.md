# Engineering CAD AI - Testing Checklist

Use this checklist to verify all functionality before deployment.

## Pre-Testing Setup

- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Environment file exists (`frontend/.env.local`)
- [ ] Claude API key set in `.env.local`
- [ ] AWS CLI configured (for backend deployment)
- [ ] SAM CLI installed (for backend deployment)

## Local Testing (No Lambda)

### 1. Start Application
```bash
cd /Users/reddy/engineering-cad-ai
./test-local.sh
```

- [ ] Dev server starts without errors
- [ ] Opens on http://localhost:3000
- [ ] No console errors in terminal

### 2. UI Verification
- [ ] Header displays "Engineering CAD AI"
- [ ] Status indicator shows "Ready" (gray dot)
- [ ] Chat panel (left) is visible
- [ ] Code editor (middle) is visible with template
- [ ] DXF preview panel (right) is visible
- [ ] Welcome message appears in chat

### 3. Simple Beam Test
**Prompt:** "Design a simply supported beam 5 meters long with a 10kN point load at center"

- [ ] Message appears in chat
- [ ] Status changes to "Analyzing engineering requirements..."
- [ ] Claude responds with analysis
- [ ] Status changes to "Generating Python code..."
- [ ] Status changes to "Executing DXF code..."
- [ ] Code appears in editor
- [ ] Status changes to "DXF generated successfully!"
- [ ] DXF content appears in right panel
- [ ] Stats show entities and layers count
- [ ] Download button is enabled
- [ ] Execution log shows attempts

**Expected time:** 10-20 seconds

### 4. Clarification Question Test
**Prompt:** "Design a beam"

- [ ] Claude asks for more information (length, loads, etc.)
- [ ] Status returns to "Waiting for more information..."
- [ ] No code generated yet
- [ ] Can continue conversation

### 5. Complex Design Test
**Prompt:** "Create a rectangular steel plate 200mm x 150mm with 4 mounting holes, 10mm diameter, 20mm from edges"

- [ ] Analysis includes dimensions
- [ ] Code generates plate outline
- [ ] Code generates 4 holes
- [ ] Code includes dimensions
- [ ] DXF shows all features
- [ ] Stats show multiple entities

### 6. Download Test
- [ ] Click "Download DXF" button
- [ ] File downloads (engineering-cad-[timestamp].dxf)
- [ ] File can be opened in AutoCAD/LibreCAD
- [ ] Drawing contains expected features

### 7. Code Editing Test
- [ ] Edit Python code in Monaco editor
- [ ] Add a simple line: `msp.add_line((100, 100), (200, 200), dxfattribs={'layer': 'M-VISIBLE'})`
- [ ] Click "Regenerate DXF"
- [ ] New DXF generated with changes
- [ ] Download and verify changes

### 8. Error Handling Test
**Prompt:** "Design a simple rectangle"
Then edit code to introduce error (e.g., remove `doc =` line)

- [ ] Click "Regenerate DXF"
- [ ] Error appears in right panel
- [ ] Error message is clear
- [ ] Status shows "Failed to generate DXF"
- [ ] Can fix and retry

### 9. Conversation Flow Test
**Prompt:** "Design a cantilever beam 3 meters long"

- [ ] First response with analysis
- [ ] Follow up: "Add a point load of 5kN at the free end"
- [ ] Claude updates design
- [ ] New code generated
- [ ] DXF updated

### 10. Performance Test
- [ ] First request (cold): completes in < 30 seconds
- [ ] Second request (warm): completes in < 20 seconds
- [ ] No memory leaks (check browser memory)
- [ ] Multiple requests work without refresh

## Backend Testing (With Lambda)

### 1. Deploy Backend
```bash
cd backend
sam build
sam deploy --guided
```

- [ ] Build succeeds
- [ ] Deployment succeeds
- [ ] API endpoint is output
- [ ] Copy endpoint URL

### 2. Update Frontend
```bash
# Edit frontend/.env.local
# Set LAMBDA_API_ENDPOINT=https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod
```

- [ ] Environment file updated
- [ ] Restart dev server

### 3. Lambda Execution Test
**Prompt:** "Design a simple beam"

- [ ] Request goes to Lambda (check logs)
- [ ] Execution is faster than local mode
- [ ] DXF generated successfully
- [ ] Check Lambda logs: `sam logs -n DxfExecutorFunction --tail`

### 4. Error Recovery Test
**Prompt:** Create a design that might have errors

- [ ] First attempt fails
- [ ] Execution log shows "Attempt 1/3"
- [ ] Claude fixes code automatically
- [ ] Execution log shows "Asking Claude to fix..."
- [ ] Second attempt succeeds
- [ ] Execution log shows success

### 5. Lambda Monitoring
```bash
sam logs -n DxfExecutorFunction --tail
```

- [ ] Logs show function invocations
- [ ] No unhandled errors
- [ ] Execution times reasonable (< 5s warm)

### 6. Cold Start Test
- [ ] Wait 5 minutes (Lambda goes cold)
- [ ] Make request
- [ ] First request slower (2-5s)
- [ ] Second request faster (< 2s)

## Production Testing (Vercel)

### 1. Deploy to Vercel
```bash
cd frontend
vercel --prod
```

- [ ] Deployment succeeds
- [ ] Site URL provided
- [ ] Environment variables set in Vercel dashboard

### 2. Production Smoke Test
- [ ] Visit production URL
- [ ] All UI elements load
- [ ] Can submit a prompt
- [ ] DXF generates successfully
- [ ] Download works

### 3. Cross-Browser Test
- [ ] Chrome: Works
- [ ] Firefox: Works
- [ ] Safari: Works
- [ ] Edge: Works

### 4. Mobile Test
- [ ] Mobile browser: Layout responsive
- [ ] Can use chat interface
- [ ] Code editor visible/usable

## Edge Cases

### 1. Empty Input
- [ ] Cannot submit empty message
- [ ] Submit button disabled

### 2. Very Long Prompt
**Prompt:** Write a 500+ word engineering problem description

- [ ] Handles long input
- [ ] Claude responds appropriately
- [ ] No truncation errors

### 3. Special Characters
**Prompt:** "Design a beam with load: 10 N/m² @ 45° angle"

- [ ] Special characters handled
- [ ] Code generates correctly
- [ ] No encoding errors

### 4. Rapid Requests
- [ ] Submit request
- [ ] Immediately submit another
- [ ] First completes, second queued
- [ ] No race conditions

### 5. Network Interruption
- [ ] Start request
- [ ] Disconnect network
- [ ] Proper error message
- [ ] Can retry when reconnected

## Regression Tests

### 1. Template Integrity
- [ ] Python template is complete
- [ ] All imports present
- [ ] Sheet setup correct
- [ ] Layers defined
- [ ] Title block renders

### 2. AI Prompts
- [ ] Analysis prompt produces good responses
- [ ] Code gen prompt produces valid Python
- [ ] Error context helps fixes

### 3. API Routes
- [ ] `/api/claude` - responds
- [ ] `/api/execute-dxf` - responds
- [ ] OPTIONS requests handled (CORS)

## Performance Benchmarks

| Metric | Target | Actual | Pass |
|--------|--------|--------|------|
| First load (cold) | < 30s | ___ | [ ] |
| Subsequent (warm) | < 20s | ___ | [ ] |
| Lambda cold start | < 5s | ___ | [ ] |
| Lambda warm | < 2s | ___ | [ ] |
| Frontend load | < 3s | ___ | [ ] |
| Code editor load | < 1s | ___ | [ ] |

## Security Checks

- [ ] API keys not in client-side code
- [ ] `.env.local` in `.gitignore`
- [ ] CORS properly configured
- [ ] No secrets in error messages
- [ ] No console.log with sensitive data

## Documentation Verification

- [ ] README.md is complete
- [ ] QUICKSTART.md is accurate
- [ ] Backend README accurate
- [ ] Frontend README accurate
- [ ] PROJECT_SUMMARY.md up to date

## Final Checks

- [ ] No TODO comments in code
- [ ] No console.log left for debugging
- [ ] All TypeScript errors resolved
- [ ] No linter warnings
- [ ] Git repository initialized (optional)
- [ ] `.gitignore` includes sensitive files

## Sign-Off

**Local Testing Complete:** __________ (Date/Initials)
**Backend Deployed:** __________ (Date/Initials)
**Production Deployed:** __________ (Date/Initials)
**All Tests Passed:** __________ (Date/Initials)

## Issues Found

List any issues discovered during testing:

1. 
2. 
3. 

## Notes

Additional notes or observations:

---

**Testing completed successfully = Ready for production!** 🚀

