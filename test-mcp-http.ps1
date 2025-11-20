# PowerShell script to test MCP server via HTTP
# Usage: .\test-mcp-http.ps1

$port = 8931
$baseUrl = "http://localhost:$port/mcp"

Write-Host "🧪 Testing MCP Playwright Server via HTTP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Initialize
Write-Host "📤 Test 1: Initialize connection..." -ForegroundColor Yellow
$initBody = @{
    jsonrpc = "2.0"
    id = 1
    method = "initialize"
    params = @{
        protocolVersion = "2024-11-05"
        capabilities = @{}
        clientInfo = @{
            name = "test-client"
            version = "1.0.0"
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $initBody -ContentType "application/json" -Headers @{"Accept"="application/json, text/event-stream"}
    Write-Host "✅ Initialize successful!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "❌ Initialize failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Ping
Write-Host "📤 Test 2: Ping..." -ForegroundColor Yellow
$pingBody = @{
    jsonrpc = "2.0"
    id = 2
    method = "ping"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $pingBody -ContentType "application/json" -Headers @{"Accept"="application/json, text/event-stream"}
    Write-Host "✅ Ping successful!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "❌ Ping failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 3: List tools
Write-Host "📤 Test 3: List available tools..." -ForegroundColor Yellow
$toolsBody = @{
    jsonrpc = "2.0"
    id = 3
    method = "tools/list"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $toolsBody -ContentType "application/json" -Headers @{"Accept"="application/json, text/event-stream"}
    Write-Host "✅ Tools list successful!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "❌ Tools list failed: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "✅ All tests completed!" -ForegroundColor Green

