# Engineering CAD AI - Backend

Production-grade AWS Lambda backend for DXF generation and Claude AI integration.

## Architecture

- **DXF Executor Lambda**: Executes Python ezdxf code with error recovery
- **Claude Proxy Lambda**: Secure proxy for Claude API calls
- **API Gateway**: RESTful API endpoints

## Prerequisites

- AWS CLI configured
- AWS SAM CLI installed
- Python 3.11
- AWS account with Lambda and API Gateway permissions

## Local Testing

```bash
# Install dependencies locally
cd lambda/dxf_executor
pip install -r requirements.txt -t .
cd ../claude_proxy
pip install -r requirements.txt -t .
cd ../..

# Build SAM application
sam build

# Test locally
sam local start-api

# Test with curl
curl -X POST http://localhost:3000/execute-dxf \
  -H "Content-Type: application/json" \
  -d '{"code": "import ezdxf\ndoc = ezdxf.new()\nmsp = doc.modelspace()\nmsp.add_line((0,0), (100,100))"}'
```

## Deployment

```bash
# Build
sam build

# Deploy
sam deploy --guided

# On first deployment, provide:
# - Stack name: engineering-cad-ai-backend
# - AWS Region: us-east-2
# - Parameter ClaudeApiKey: [your-claude-api-key]
# - Confirm changes: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to configuration file: Y

# Subsequent deployments
sam deploy

# Get API endpoint
aws cloudformation describe-stacks \
  --stack-name engineering-cad-ai-backend \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

## API Endpoints

### POST /execute-dxf

Execute DXF generation code.

**Request:**
```json
{
  "code": "import ezdxf\ndoc = ezdxf.new()...",
  "max_retries": 3
}
```

**Response:**
```json
{
  "success": true,
  "dxf": "0\nSECTION...",
  "stats": {
    "entities": 15,
    "layers": 3,
    "bounds": {...}
  },
  "execution_log": ["Attempt 1/3", "..."],
  "attempts": 1
}
```

### POST /claude

Proxy Claude API calls.

**Request:**
```json
{
  "userMessage": "Design a beam",
  "systemPrompt": "You are an engineering AI...",
  "isCodeGen": true,
  "conversationHistory": [],
  "errorContext": null
}
```

**Response:**
```json
{
  "content": "AI response...",
  "usage": {
    "input_tokens": 120,
    "output_tokens": 450
  }
}
```

## Environment Variables

- `CLAUDE_API_KEY`: Anthropic Claude API key (required)

## Monitoring

```bash
# View logs
sam logs -n DxfExecutorFunction --tail
sam logs -n ClaudeProxyFunction --tail

# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=engineering-cad-ai-backend-DxfExecutorFunction \
  --start-time 2025-10-05T00:00:00Z \
  --end-time 2025-10-05T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## Cleanup

```bash
sam delete --stack-name engineering-cad-ai-backend
```

