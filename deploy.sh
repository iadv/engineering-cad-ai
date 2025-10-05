#!/bin/bash

# Engineering CAD AI - Deployment Script
# This script deploys both backend (AWS Lambda) and frontend (local test)

set -e

echo "🚀 Engineering CAD AI - Deployment Script"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

command -v sam >/dev/null 2>&1 || { echo -e "${RED}❌ AWS SAM CLI not found. Install: pip install aws-sam-cli${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js not found. Install from nodejs.org${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm not found. Install Node.js${NC}"; exit 1; }

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Deploy Backend
echo ""
echo "🔧 Deploying Backend (AWS Lambda)..."
echo "======================================"

cd backend

echo "Building Lambda functions..."
sam build

echo ""
echo -e "${YELLOW}Ready to deploy backend to AWS.${NC}"
echo "You'll be prompted for:"
echo "  - Stack name: engineering-cad-ai-backend"
echo "  - AWS Region: us-east-2 (or your preferred region)"
echo "  - Claude API Key: (from your .env file)"
echo ""
read -p "Press Enter to continue with deployment..."

sam deploy --guided

# Capture API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name engineering-cad-ai-backend \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ -n "$API_ENDPOINT" ]; then
  echo ""
  echo -e "${GREEN}✓ Backend deployed successfully!${NC}"
  echo ""
  echo "API Endpoint: $API_ENDPOINT"
  echo ""
  
  # Update frontend .env.local
  cd ../frontend
  
  if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
  fi
  
  # Update or add LAMBDA_API_ENDPOINT
  if grep -q "LAMBDA_API_ENDPOINT=" .env.local; then
    # macOS compatible sed
    sed -i '' "s|LAMBDA_API_ENDPOINT=.*|LAMBDA_API_ENDPOINT=$API_ENDPOINT|" .env.local
  else
    echo "LAMBDA_API_ENDPOINT=$API_ENDPOINT" >> .env.local
  fi
  
  echo -e "${GREEN}✓ Updated frontend/.env.local with API endpoint${NC}"
else
  echo -e "${RED}⚠ Could not retrieve API endpoint. Check AWS CloudFormation console.${NC}"
  cd ../frontend
fi

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend..."
echo "========================="

if [ ! -d "node_modules" ]; then
  echo "Installing npm dependencies..."
  npm install
else
  echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Build frontend
echo ""
echo "Building frontend..."
npm run build

echo ""
echo -e "${GREEN}✓ Frontend built successfully!${NC}"

# Final instructions
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Test locally:"
echo "   cd frontend"
echo "   npm run dev"
echo "   Open http://localhost:3000"
echo ""
echo "2. Deploy to Vercel:"
echo "   cd frontend"
echo "   npm i -g vercel"
echo "   vercel"
echo ""
echo "3. Set environment variables in Vercel:"
if [ -n "$API_ENDPOINT" ]; then
  echo "   LAMBDA_API_ENDPOINT=$API_ENDPOINT"
else
  echo "   LAMBDA_API_ENDPOINT=(from CloudFormation outputs)"
fi
echo ""
echo "4. Monitor Lambda logs:"
echo "   sam logs -n DxfExecutorFunction --tail"
echo ""
echo "=========================================="

