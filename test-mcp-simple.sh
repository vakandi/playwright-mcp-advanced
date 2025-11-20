#!/bin/bash
# Simple test script for MCP server
# This runs the server and sends a test message

echo "🧪 Testing MCP Playwright Server"
echo "================================"
echo ""

# Load .env if it exists
if [ -f "../.env" ]; then
  export $(cat ../.env | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "Environment:"
echo "  USE_EXTENSION=$USE_EXTENSION"
echo "  USE_BRAVE=$USE_BRAVE"
echo ""

echo "Starting MCP server..."
echo "Press Ctrl+C to stop"
echo ""

# Run the server (it will wait for input)
node cli-brave.js

