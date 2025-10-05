#!/bin/bash

# Engineering CAD AI - Local Testing Script
# Test the application locally before deploying

set -e

echo "🧪 Engineering CAD AI - Local Testing"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if in correct directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
  echo -e "${RED}❌ Please run this script from the project root directory${NC}"
  exit 1
fi

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    echo "Creating .env.local from example..."
    cp .env.example .env.local
  else
    echo "Creating .env.local..."
    cat > .env.local << 'EOF'
# Claude API Key (for local development without Lambda)
CLAUDE_API_KEY=your_claude_api_key_here

# Lambda API Endpoint (leave empty for local dev)
LAMBDA_API_ENDPOINT=
EOF
  fi
  echo -e "${YELLOW}⚠ Please verify frontend/.env.local has your CLAUDE_API_KEY${NC}"
  echo "Press Enter to continue..."
  read
fi

# Check if Claude API key is set
if ! grep -q "CLAUDE_API_KEY=sk-ant-" .env.local; then
  echo -e "${RED}❌ CLAUDE_API_KEY not set in .env.local${NC}"
  echo "Please add your Claude API key to frontend/.env.local"
  exit 1
fi

echo -e "${GREEN}✓ Frontend configured${NC}"

# Check if Lambda endpoint is set
if grep -q "^LAMBDA_API_ENDPOINT=https://" .env.local; then
  echo -e "${GREEN}✓ Lambda endpoint configured - will use production backend${NC}"
  USE_LAMBDA=true
else
  echo -e "${YELLOW}⚠ Lambda endpoint not set - will use Claude API directly${NC}"
  echo "  This is fine for local testing but slower than Lambda"
  USE_LAMBDA=false
fi

# Start development server
echo ""
echo "🚀 Starting development server..."
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Server starting on http://localhost:3000${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Test with these example prompts:"
echo ""
echo "1. Simple beam:"
echo "   'Design a simply supported beam 5 meters long with a 10kN point load at center'"
echo ""
echo "2. Plate with holes:"
echo "   'Create a rectangular steel plate 200mm x 150mm with 4 mounting holes'"
echo ""
echo "3. Cantilever:"
echo "   'Draw a cantilever beam 3 meters long with uniform load'"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev

