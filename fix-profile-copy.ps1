# PowerShell script to properly copy Brave profile
# Run this with Brave COMPLETELY CLOSED

param(
    [string]$SourceProfile = "$env:USERPROFILE\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default",
    [string]$DestBase = "C:\MCP_Brave_Profile"
)

# Set up User Data/Default structure
$DestUserData = Join-Path $DestBase "User Data"
$DestProfile = Join-Path $DestUserData "Default"

Write-Host "[MCP-PLAYWRIGHT] Brave Profile Copy Script" -ForegroundColor Cyan
Write-Host ""

# Check if Brave is running
$braveProcesses = Get-Process -Name "brave" -ErrorAction SilentlyContinue
if ($braveProcesses) {
    Write-Host "[MCP-PLAYWRIGHT] ERROR: Brave browser is currently running!" -ForegroundColor Red
    Write-Host "[MCP-PLAYWRIGHT] Please close ALL Brave windows and processes before copying the profile." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[MCP-PLAYWRIGHT] To force close Brave, run:" -ForegroundColor Yellow
    Write-Host "  taskkill /F /IM brave.exe" -ForegroundColor White
    exit 1
}

# Check if source exists
if (-not (Test-Path $SourceProfile)) {
    Write-Host "[MCP-PLAYWRIGHT] ERROR: Source profile not found: $SourceProfile" -ForegroundColor Red
    exit 1
}

Write-Host "[MCP-PLAYWRIGHT] Source: $SourceProfile" -ForegroundColor Green
Write-Host "[MCP-PLAYWRIGHT] Destination: $DestProfile" -ForegroundColor Green
Write-Host "[MCP-PLAYWRIGHT] Structure: User Data\Default" -ForegroundColor Green
Write-Host ""

# Remove User Data directory if it exists (to avoid conflicts)
if (Test-Path $DestUserData) {
    Write-Host "[MCP-PLAYWRIGHT] Removing existing destination..." -ForegroundColor Yellow
    Remove-Item -Path $DestUserData -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Create User Data/Default directory structure
Write-Host "[MCP-PLAYWRIGHT] Copying profile (this may take a minute)..." -ForegroundColor Cyan
$destParent = Split-Path -Parent $DestUserData
if (-not (Test-Path $destParent)) {
    New-Item -Path $destParent -ItemType Directory -Force | Out-Null
}
New-Item -Path $DestUserData -ItemType Directory -Force | Out-Null
New-Item -Path $DestProfile -ItemType Directory -Force | Out-Null

# Copy using robocopy for better reliability with locked files
# Quote paths properly to handle spaces
Write-Host "[MCP-PLAYWRIGHT] From: $SourceProfile" -ForegroundColor Gray
Write-Host "[MCP-PLAYWRIGHT] To: $DestProfile" -ForegroundColor Gray
Write-Host ""

# Use robocopy with properly quoted paths
# /COPY:DAT = Data, Attributes, Timestamps (avoids permission issues with /COPYALL)
$robocopyResult = & robocopy "`"$SourceProfile`"" "`"$DestProfile`"" /E /COPY:DAT /R:3 /W:1 /NFL /NDL /NP /NJH /NJS 2>&1
$robocopyExitCode = $LASTEXITCODE

# If robocopy fails, try Copy-Item as fallback
if ($robocopyExitCode -ge 8 -and $robocopyExitCode -ne 1) {
    Write-Host "[MCP-PLAYWRIGHT] Robocopy failed (exit code: $robocopyExitCode). Trying Copy-Item..." -ForegroundColor Yellow
    try {
        Copy-Item -Path $SourceProfile -Destination $DestProfile -Recurse -Force -ErrorAction Stop
        Write-Host "[MCP-PLAYWRIGHT] Copy completed using Copy-Item" -ForegroundColor Green
        $robocopyExitCode = 0  # Treat as success
    } catch {
        Write-Host "[MCP-PLAYWRIGHT] Copy-Item also failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "[MCP-PLAYWRIGHT] Error details: $_" -ForegroundColor Red
    }
}

# Robocopy returns 0-7 for success, 8+ for errors
if ($robocopyExitCode -lt 8) {
    Write-Host "[MCP-PLAYWRIGHT] SUCCESS: Profile copied successfully!" -ForegroundColor Green
    
    # Verify essential files
    Write-Host ""
    Write-Host "[MCP-PLAYWRIGHT] Verifying essential files..." -ForegroundColor Cyan
    $essentialFiles = @('Preferences', 'Local State', 'Cookies', 'Bookmarks', 'Bookmarks.bak', 'History')
    $missing = @()
    
    foreach ($file in $essentialFiles) {
        if (Test-Path (Join-Path $DestProfile $file)) {
            Write-Host "[MCP-PLAYWRIGHT]   OK: $file" -ForegroundColor Green
        } else {
            Write-Host "[MCP-PLAYWRIGHT]   MISSING: $file" -ForegroundColor Red
            $missing += $file
        }
    }
    
    # Check Extensions (in Default directory)
    $extensionsPath = Join-Path $DestProfile "Extensions"
    if (Test-Path $extensionsPath) {
        $extCount = (Get-ChildItem $extensionsPath -Directory -ErrorAction SilentlyContinue).Count
        Write-Host "[MCP-PLAYWRIGHT]   OK: Extensions ($extCount extensions)" -ForegroundColor Green
    } else {
        Write-Host "[MCP-PLAYWRIGHT]   MISSING: Extensions" -ForegroundColor Red
        $missing += "Extensions"
    }
    
    # Check Cookies in Network directory
    $cookiesPath = Join-Path $DestProfile "Network\Cookies"
    if (Test-Path $cookiesPath) {
        Write-Host "[MCP-PLAYWRIGHT]   OK: Cookies (in Network folder)" -ForegroundColor Green
    } else {
        Write-Host "[MCP-PLAYWRIGHT]   NOTE: Cookies file not found (may be in Network folder)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    if ($missing.Count -gt 0) {
        Write-Host "[MCP-PLAYWRIGHT] WARNING: Some files are missing:" -ForegroundColor Yellow
        Write-Host "[MCP-PLAYWRIGHT]   $($missing -join ', ')" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "[MCP-PLAYWRIGHT] This might happen if Brave was running during copy." -ForegroundColor Yellow
        Write-Host "[MCP-PLAYWRIGHT] Try closing Brave completely and running this script again." -ForegroundColor Yellow
    } else {
        Write-Host "[MCP-PLAYWRIGHT] SUCCESS: All essential files are present!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "[MCP-PLAYWRIGHT] Profile copy complete!" -ForegroundColor Green
    Write-Host "[MCP-PLAYWRIGHT] You can now use the Brave MCP server with your profile." -ForegroundColor Cyan
} else {
    Write-Host "[MCP-PLAYWRIGHT] ERROR: Profile copy failed!" -ForegroundColor Red
    Write-Host "[MCP-PLAYWRIGHT] Exit code: $robocopyExitCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "[MCP-PLAYWRIGHT] Make sure:" -ForegroundColor Yellow
    Write-Host "[MCP-PLAYWRIGHT]   - Brave is completely closed" -ForegroundColor Yellow
    Write-Host "[MCP-PLAYWRIGHT]   - You have write permissions to C:\MCP_Brave_Profile" -ForegroundColor Yellow
    Write-Host "[MCP-PLAYWRIGHT]   - Source profile path is correct" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[MCP-PLAYWRIGHT] Profile structure: C:\MCP_Brave_Profile\User Data\Default\" -ForegroundColor Cyan
    exit 1
}
