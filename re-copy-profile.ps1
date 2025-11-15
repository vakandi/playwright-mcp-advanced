# Quick script to re-copy your Brave profile
# Make sure Brave is COMPLETELY CLOSED first!

Write-Host "[MCP-PLAYWRIGHT] Re-copying Brave Profile for MCP" -ForegroundColor Cyan
Write-Host ""

# Kill Brave if running
$braveProcesses = Get-Process -Name "brave" -ErrorAction SilentlyContinue
if ($braveProcesses) {
    Write-Host "[MCP-PLAYWRIGHT] WARNING: Brave is running. Killing processes..." -ForegroundColor Yellow
    taskkill /F /IM brave.exe 2>$null
    Start-Sleep -Seconds 3
}

$sourceProfile = "$env:USERPROFILE\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default"
$destBase = "C:\MCP_Brave_Profile"
$destUserData = Join-Path $destBase "User Data"
$destProfile = Join-Path $destUserData "Default"

# Check source
if (-not (Test-Path $sourceProfile)) {
    Write-Host "[MCP-PLAYWRIGHT] ERROR: Source profile not found: $sourceProfile" -ForegroundColor Red
    exit 1
}

# Remove old copy (remove entire User Data directory to avoid conflicts)
if (Test-Path $destUserData) {
    Write-Host "[MCP-PLAYWRIGHT] Removing old profile copy..." -ForegroundColor Yellow
    Remove-Item -Path $destUserData -Recurse -Force
    Start-Sleep -Seconds 2
}

# Create User Data directory structure
New-Item -Path $destUserData -ItemType Directory -Force | Out-Null
New-Item -Path $destProfile -ItemType Directory -Force | Out-Null

# Copy using robocopy (quote paths with spaces)
Write-Host "[MCP-PLAYWRIGHT] Copying profile (this may take a minute)..." -ForegroundColor Cyan
Write-Host "[MCP-PLAYWRIGHT] From: $sourceProfile" -ForegroundColor Gray
Write-Host "[MCP-PLAYWRIGHT] To: $destProfile" -ForegroundColor Gray
Write-Host "[MCP-PLAYWRIGHT] Structure: User Data\Default" -ForegroundColor Gray

# Use quoted paths for robocopy (without /COPYALL to avoid permission issues)
# /COPY:DAT = Data, Attributes, Timestamps (sufficient for profile copy)
$robocopyResult = & robocopy "`"$sourceProfile`"" "`"$destProfile`"" /E /COPY:DAT /R:3 /W:1 /NFL /NDL /NP /NJH /NJS 2>&1
$robocopyExitCode = $LASTEXITCODE

# Robocopy exit codes: 0-7 = success, 8+ = error
# But 16 means "Serious error - no files copied"
if ($robocopyExitCode -ge 8) {
    Write-Host "[MCP-PLAYWRIGHT] Robocopy exit code: $robocopyExitCode" -ForegroundColor Yellow
    Write-Host "[MCP-PLAYWRIGHT] Trying alternative method..." -ForegroundColor Yellow
    
    # Try with Copy-Item as fallback
    try {
        Copy-Item -Path $sourceProfile -Destination $destProfile -Recurse -Force -ErrorAction Stop
        Write-Host "[MCP-PLAYWRIGHT] Copy completed using Copy-Item" -ForegroundColor Green
    } catch {
        Write-Host "[MCP-PLAYWRIGHT] Copy-Item also failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verify copy was successful by checking for essential files in Default directory
$hasPreferences = Test-Path (Join-Path $destProfile "Preferences")
$hasBookmarks = Test-Path (Join-Path $destProfile "Bookmarks")
$hasExtensions = Test-Path (Join-Path $destProfile "Extensions")
$hasCookies = Test-Path (Join-Path $destProfile "Network\Cookies")

if ($hasPreferences) {
    Write-Host "[MCP-PLAYWRIGHT] SUCCESS: Profile copied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[MCP-PLAYWRIGHT] Preferences: $hasPreferences" -ForegroundColor $(if($hasPreferences){'Green'}else{'Red'})
    Write-Host "[MCP-PLAYWRIGHT] Bookmarks: $hasBookmarks" -ForegroundColor $(if($hasBookmarks){'Green'}else{'Yellow'})
    Write-Host "[MCP-PLAYWRIGHT] Extensions: $hasExtensions" -ForegroundColor $(if($hasExtensions){'Green'}else{'Yellow'})
    Write-Host "[MCP-PLAYWRIGHT] Cookies: $hasCookies" -ForegroundColor $(if($hasCookies){'Green'}else{'Yellow'})
    
    if (-not $hasCookies) {
        Write-Host ""
        Write-Host "[MCP-PLAYWRIGHT] NOTE: Cookies file not found (this may be normal if Brave stores cookies differently)" -ForegroundColor Yellow
    }
    
    if ($hasBookmarks -and $hasExtensions) {
        Write-Host ""
        Write-Host "[MCP-PLAYWRIGHT] Ready to use! Restart Cursor to use the updated profile." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "[MCP-PLAYWRIGHT] WARNING: Some profile components are missing." -ForegroundColor Yellow
        Write-Host "[MCP-PLAYWRIGHT] Bookmarks or Extensions may not work correctly." -ForegroundColor Yellow
        Write-Host "[MCP-PLAYWRIGHT] Try closing Brave completely and running this script again." -ForegroundColor Yellow
    }
} else {
    Write-Host "[MCP-PLAYWRIGHT] ERROR: Copy failed or incomplete. Make sure Brave is closed!" -ForegroundColor Red
    Write-Host "[MCP-PLAYWRIGHT] Robocopy exit code: $robocopyExitCode" -ForegroundColor Red
    exit 1
}
