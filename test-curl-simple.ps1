# Simple curl test script for MCP server
# Make sure the server is running: node cli-brave.js --port 8931

$headers = @{
    "Content-Type" = "application/json"
    "Accept" = "application/json, text/event-stream"
}

Write-Host "🧪 Testing MCP Playwright Server" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Initialize
Write-Host "📤 1. Initialize..." -ForegroundColor Yellow
$initBody = '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
$initResponse = curl.exe -X POST http://localhost:8931/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d $initBody
Write-Host $initResponse
Write-Host ""

# 2. Ping
Write-Host "📤 2. Ping..." -ForegroundColor Yellow
$pingBody = '{"jsonrpc":"2.0","id":2,"method":"ping"}'
$pingResponse = curl.exe -X POST http://localhost:8931/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d $pingBody
Write-Host $pingResponse
Write-Host ""

# 3. List tools
Write-Host "📤 3. List tools..." -ForegroundColor Yellow
$toolsBody = '{"jsonrpc":"2.0","id":3,"method":"tools/list"}'
$toolsResponse = curl.exe -X POST http://localhost:8931/mcp -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d $toolsBody
Write-Host $toolsResponse
Write-Host ""

Write-Host "✅ Tests completed!" -ForegroundColor Green

