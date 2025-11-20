# PowerShell script for hot syncing Brave profile while Brave is running
# Uses robocopy with retry logic to handle locked files

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceProfile,
    
    [Parameter(Mandatory=$true)]
    [string]$DestBase,
    
    [int]$RetryCount = 5,
    [int]$RetryDelay = 2
)

# Set up User Data/Default structure
$DestUserData = Join-Path $DestBase "User Data"
$DestProfile = Join-Path $DestUserData "Default"

Write-Host "[MCP-PLAYWRIGHT] Hot Syncing Brave Profile (Brave can be running)" -ForegroundColor Cyan
Write-Host ""

# Check if source exists
if (-not (Test-Path $SourceProfile)) {
    Write-Host "[MCP-PLAYWRIGHT] ERROR: Source profile not found: $SourceProfile" -ForegroundColor Red
    exit 1
}

Write-Host "[MCP-PLAYWRIGHT] Source: $SourceProfile" -ForegroundColor Green
Write-Host "[MCP-PLAYWRIGHT] Destination: $DestProfile" -ForegroundColor Green
Write-Host "[MCP-PLAYWRIGHT] Structure: User Data\Default" -ForegroundColor Green
Write-Host ""

# Create User Data directory structure if it doesn't exist
if (-not (Test-Path $DestUserData)) {
    New-Item -Path $DestUserData -ItemType Directory -Force | Out-Null
}
if (-not (Test-Path $DestProfile)) {
    New-Item -Path $DestProfile -ItemType Directory -Force | Out-Null
}

# Essential files to copy (with retry logic)
$essentialFiles = @(
    @{ Name = "Preferences"; Path = "Preferences"; DestDir = "Default"; Required = $true },
    @{ Name = "Local State"; Path = "Local State"; DestDir = "User Data"; Required = $true },
    @{ Name = "Bookmarks"; Path = "Bookmarks"; DestDir = "Default"; Required = $false },
    @{ Name = "Bookmarks.bak"; Path = "Bookmarks.bak"; DestDir = "Default"; Required = $false },
    @{ Name = "Cookies"; Path = "Network\Cookies"; DestDir = "Default"; Required = $false; PreservePath = $true },
    @{ Name = "Cookies-journal"; Path = "Network\Cookies-journal"; DestDir = "Default"; Required = $false; PreservePath = $true },
    @{ Name = "Cookies-wal"; Path = "Network\Cookies-wal"; DestDir = "Default"; Required = $false; PreservePath = $true }
)

# Copy essential files with retry logic
$copiedFiles = @()
$failedFiles = @()

# Get source User Data directory (parent of Default)
$sourceUserData = Split-Path $SourceProfile -Parent

foreach ($file in $essentialFiles) {
    # Determine source file path
    if ($file.DestDir -eq "User Data") {
        # Local State is in User Data directory
        $srcFile = Join-Path $sourceUserData $file.Path
        $destFile = Join-Path $DestUserData $file.Name
    } else {
        # Other files are in Default directory
        $srcFile = Join-Path $SourceProfile $file.Path
        # Preserve full path structure for files like Network\Cookies
        if ($file.PreservePath) {
            $destFile = Join-Path $DestProfile $file.Path
        } else {
            $destFile = Join-Path $DestProfile $file.Name
        }
    }
    
    if (-not (Test-Path $srcFile)) {
        if ($file.Required) {
            Write-Host "[MCP-PLAYWRIGHT] WARNING: Required file not found: $($file.Name)" -ForegroundColor Yellow
        }
        continue
    }
    
    $copied = $false
    for ($i = 1; $i -le $RetryCount; $i++) {
        try {
            # Ensure destination directory exists
            $destDir = Split-Path $destFile -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -Path $destDir -ItemType Directory -Force | Out-Null
            }
            
            Copy-Item -Path $srcFile -Destination $destFile -Force -ErrorAction Stop
            $copied = $true
            $copiedFiles += $file.Name
            Write-Host "[MCP-PLAYWRIGHT]   ✓ Copied: $($file.Name)" -ForegroundColor Green
            break
        } catch {
            if ($i -lt $RetryCount) {
                Start-Sleep -Seconds $RetryDelay
            } else {
                Write-Host "[MCP-PLAYWRIGHT]   ✗ Failed: $($file.Name) (locked after $RetryCount retries)" -ForegroundColor Yellow
                $failedFiles += $file.Name
            }
        }
    }
}

# Copy Network directory with robocopy (handles locked files better) - CRITICAL for cookies
$networkSrc = Join-Path $SourceProfile "Network"
$networkDest = Join-Path $DestProfile "Network"

if (Test-Path $networkSrc) {
    Write-Host "[MCP-PLAYWRIGHT] Copying Network directory (contains cookies)..." -ForegroundColor Cyan
    $robocopyResult = & robocopy "`"$networkSrc`"" "`"$networkDest`"" /E /COPY:DAT /R:$RetryCount /W:$RetryDelay /NFL /NDL /NP /NJH /NJS 2>&1
    $robocopyExitCode = $LASTEXITCODE
    
    if ($robocopyExitCode -lt 8) {
        $cookieFile = Join-Path $networkDest "Cookies"
        if (Test-Path $cookieFile) {
            Write-Host "[MCP-PLAYWRIGHT]   ✓ Network directory copied (Cookies file present)" -ForegroundColor Green
            $copiedFiles += "Network"
        } else {
            Write-Host "[MCP-PLAYWRIGHT]   ⚠ Network directory copied but Cookies file not found" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[MCP-PLAYWRIGHT]   ⚠ Network directory copy had issues (exit code: $robocopyExitCode)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[MCP-PLAYWRIGHT]   ⚠ Network directory not found in source" -ForegroundColor Yellow
}

# Copy Extensions directory with robocopy (handles locked files better)
$extensionsSrc = Join-Path $SourceProfile "Extensions"
$extensionsDest = Join-Path $DestProfile "Extensions"

if (Test-Path $extensionsSrc) {
    Write-Host "[MCP-PLAYWRIGHT] Copying Extensions directory..." -ForegroundColor Cyan
    $robocopyResult = & robocopy "`"$extensionsSrc`"" "`"$extensionsDest`"" /E /COPY:DAT /R:$RetryCount /W:$RetryDelay /NFL /NDL /NP /NJH /NJS 2>&1
    $robocopyExitCode = $LASTEXITCODE
    
    if ($robocopyExitCode -lt 8) {
        $extCount = (Get-ChildItem $extensionsDest -Directory -ErrorAction SilentlyContinue).Count
        Write-Host "[MCP-PLAYWRIGHT]   ✓ Extensions copied ($extCount extensions)" -ForegroundColor Green
        $copiedFiles += "Extensions"
    } else {
        Write-Host "[MCP-PLAYWRIGHT]   ⚠ Extensions copy had issues (exit code: $robocopyExitCode)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[MCP-PLAYWRIGHT]   ⚠ Extensions directory not found in source" -ForegroundColor Yellow
}

# Use robocopy for full profile sync (with retry logic for locked files)
Write-Host ""
Write-Host "[MCP-PLAYWRIGHT] Performing full profile sync with robocopy..." -ForegroundColor Cyan
$robocopyResult = & robocopy "`"$SourceProfile`"" "`"$DestProfile`"" /E /COPY:DAT /R:$RetryCount /W:$RetryDelay /NFL /NDL /NP /NJH /NJS 2>&1
$robocopyExitCode = $LASTEXITCODE

# Robocopy exit codes: 0-7 = success, 8+ = error
if ($robocopyExitCode -lt 8) {
    Write-Host "[MCP-PLAYWRIGHT] ✅ Profile hot sync completed successfully!" -ForegroundColor Green
    
    # Verify essential files
    Write-Host ""
    Write-Host "[MCP-PLAYWRIGHT] Verifying essential files..." -ForegroundColor Cyan
    $verified = @()
    $missing = @()
    
    foreach ($file in $essentialFiles) {
        # Determine check path based on file location
        if ($file.DestDir -eq "User Data") {
            $checkPath = Join-Path $DestUserData $file.Name
        } else {
            # Preserve full path structure for files like Network\Cookies
            if ($file.PreservePath) {
                $checkPath = Join-Path $DestProfile $file.Path
            } else {
                $checkPath = Join-Path $DestProfile $file.Name
            }
        }
        
        if (Test-Path $checkPath) {
            Write-Host "[MCP-PLAYWRIGHT]   ✓ $($file.Name)" -ForegroundColor Green
            $verified += $file.Name
        } else {
            if ($file.Required) {
                Write-Host "[MCP-PLAYWRIGHT]   ✗ $($file.Name) (MISSING)" -ForegroundColor Red
                $missing += $file.Name
            } else {
                Write-Host "[MCP-PLAYWRIGHT]   ⚠ $($file.Name) (optional, not found)" -ForegroundColor Yellow
            }
        }
    }
    
    # Check Network directory (Cookies)
    if (Test-Path $networkDest) {
        $cookieFile = Join-Path $networkDest "Cookies"
        if (Test-Path $cookieFile) {
            Write-Host "[MCP-PLAYWRIGHT]   ✓ Network\Cookies" -ForegroundColor Green
            $verified += "Network\Cookies"
        } else {
            Write-Host "[MCP-PLAYWRIGHT]   ⚠ Network directory exists but Cookies file missing" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[MCP-PLAYWRIGHT]   ⚠ Network directory (not found)" -ForegroundColor Yellow
    }
    
    # Check Extensions
    if (Test-Path $extensionsDest) {
        $extCount = (Get-ChildItem $extensionsDest -Directory -ErrorAction SilentlyContinue).Count
        Write-Host "[MCP-PLAYWRIGHT]   ✓ Extensions ($extCount extensions)" -ForegroundColor Green
        $verified += "Extensions"
    } else {
        Write-Host "[MCP-PLAYWRIGHT]   ⚠ Extensions (not found)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    if ($missing.Count -gt 0) {
        Write-Host "[MCP-PLAYWRIGHT] WARNING: Some required files are missing: $($missing -join ', ')" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "[MCP-PLAYWRIGHT] ✅ All essential files verified!" -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "[MCP-PLAYWRIGHT] ⚠️  Robocopy completed with warnings (exit code: $robocopyExitCode)" -ForegroundColor Yellow
    Write-Host "[MCP-PLAYWRIGHT] Some files may be locked and couldn't be copied." -ForegroundColor Yellow
    Write-Host "[MCP-PLAYWRIGHT] Profile sync completed with partial success." -ForegroundColor Yellow
    exit 0
}

