#!/bin/bash

# Engineering CAD AI - Local Development Startup Script
# This script starts the frontend dev server with proper environment variables

set -e

echo "🚀 Starting Engineering CAD AI - Local Development"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if frontend/.env.local exists
if [ ! -f "frontend/.env.local" ]; then
  echo -e "${YELLOW}⚠️  Creating frontend/.env.local...${NC}"
  cat > frontend/.env.local << 'EOF'
# Claude API Key (replace with your actual key)
CLAUDE_API_KEY=your_claude_api_key_here

# Lambda API Endpoint (AWS - Production)
LAMBDA_API_ENDPOINT=https://your-lambda-endpoint.execute-api.region.amazonaws.com/Prod
EOF
  echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
fi

echo ""
echo -e "${GREEN}✓ Environment variables loaded${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  cd frontend
  npm install
  cd ..
  echo -e "${GREEN}✓ Dependencies installed${NC}"
  echo ""
fi

# Kill any existing dev servers on ports 3000-3005
echo "🧹 Cleaning up old dev servers..."
lsof -ti:3000,3001,3002,3003,3004,3005 | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Start the dev server
echo -e "${GREEN}🎯 Starting Next.js dev server...${NC}"
echo ""
echo "=================================================="
echo "  Local URL: http://localhost:3000"
echo "  Press Ctrl+C to stop"
echo "=================================================="
echo ""

cd frontend
npm run dev

