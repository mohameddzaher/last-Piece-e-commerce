#!/bin/bash

# Last Piece - Project Startup Guide
# ==================================

echo "🚀 Last Piece - E-Commerce Platform"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo -e "${YELLOW}📋 Checking Node.js version...${NC}"
node -v

echo ""
echo -e "${YELLOW}🔌 Checking ports...${NC}"

# Check if ports are available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Port 3000 is in use!${NC}"
else
    echo -e "${GREEN}✅ Port 3000 is available${NC}"
fi

if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Port 5001 is in use!${NC}"
else
    echo -e "${GREEN}✅ Port 5001 is available${NC}"
fi

echo ""
echo -e "${YELLOW}📦 Starting Backend Server...${NC}"
echo ""
echo "Run this in Terminal 1:"
echo -e "${GREEN}cd /Users/mohamedzaher/Desktop/last-piece/backend && npm run dev${NC}"
echo ""

echo -e "${YELLOW}🎨 Starting Frontend Server...${NC}"
echo ""
echo "Run this in Terminal 2:"
echo -e "${GREEN}cd /Users/mohamedzaher/Desktop/last-piece/frontend && npm run dev${NC}"
echo ""

echo -e "${YELLOW}🌐 Open in Browser...${NC}"
echo ""
echo "Once both servers are running, open:"
echo -e "${GREEN}http://localhost:3000${NC}"
echo ""

echo "========================================="
echo -e "${GREEN}✨ Ready to go! Start the servers! ✨${NC}"
echo "========================================="
