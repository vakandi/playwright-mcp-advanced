# Quick Setup Guide - Windows

This guide will help you set up MCP Playwright with Brave Browser on Windows.

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Brave Browser** - [Download](https://brave.com/download/)
3. **Git** (optional, for cloning)

## Step 1: Install Dependencies

Open PowerShell in the project directory and run:

```powershell
npm install
```

## Step 2: Create Your Brave Profile Copy

**🔥 With Hot Sync (Recommended)**: No manual setup needed! The profile will be automatically synced on first launch, even if Brave is running. You can skip to Step 3.

**⚠️ Without Hot Sync**: Close Brave Browser completely before proceeding!

**Note:** The profile must be copied to `C:\MCP_Brave_Profile\User Data\Default\` (not directly to `C:\MCP_Brave_Profile\`). This matches Chromium's expected directory structure, where Playwright will use the "Default" profile from within the "User Data" directory.

### Option A: Use Hot Sync (Recommended - No Setup Needed!)

Hot sync is enabled by default and will automatically sync your profile on first launch, even when Brave is running. Just start the MCP server and it will handle everything!

If you prefer manual setup, see Option B below.

### Option B: Use the PowerShell Script (Manual Setup)

1. **Close ALL Brave windows completely** (only needed if hot sync is disabled)
2. **Kill any remaining Brave processes** (if needed):
   ```powershell
   taskkill /F /IM brave.exe
   ```
3. Navigate to the project directory:
   ```powershell
   cd path\to\mcp-playwright-brave
   ```
4. Run the profile copy script:
   ```powershell
   .\fix-profile-copy.ps1
   ```

This script will:
- Check if Brave is running (and warn you)
- Create the `User Data\Default` directory structure automatically
- Copy your entire profile using `robocopy` (more reliable than xcopy)
- Verify all essential files are copied (Cookies, Bookmarks, Extensions, etc.)
- Show you what's missing if anything

**Profile Structure Created:**
```
C:\MCP_Brave_Profile\
  └── User Data\
      └── Default\
          ├── Preferences
          ├── Bookmarks
          ├── Extensions\
          ├── Network\
          │   └── Cookies
          └── ...
```

### Option B: Manual Copy with Robocopy

1. **Close ALL Brave windows completely**
2. **Kill any remaining Brave processes**:
   ```powershell
   taskkill /F /IM brave.exe
   ```
3. Wait a few seconds for Brave to fully close
4. Run these commands to copy your profile:
   ```powershell
   # Remove old copy if it exists
   if (Test-Path "C:\MCP_Brave_Profile\User Data") {
       Remove-Item -Path "C:\MCP_Brave_Profile\User Data" -Recurse -Force
   }
   
   # Create directory structure
   New-Item -Path "C:\MCP_Brave_Profile\User Data\Default" -ItemType Directory -Force
   
   # Copy using robocopy (more reliable than xcopy for locked files)
   robocopy "%USERPROFILE%\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default" "C:\MCP_Brave_Profile\User Data\Default" /E /COPY:DAT /R:3 /W:1
   ```

### Option C: Manual Copy (File Explorer)

1. **Close ALL Brave windows completely**
2. **Kill any remaining Brave processes**:
   ```powershell
   taskkill /F /IM brave.exe
   ```
3. Wait a few seconds
4. Open File Explorer
5. Navigate to: `C:\Users\YOUR_USERNAME\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default`
6. Select all files (Ctrl+A)
7. Copy (Ctrl+C)
8. Navigate to `C:\` and create these folders:
   - `C:\MCP_Brave_Profile` (if it doesn't exist)
   - `C:\MCP_Brave_Profile\User Data` (if it doesn't exist)
   - `C:\MCP_Brave_Profile\User Data\Default` (if it doesn't exist)
9. Paste (Ctrl+V) into the `Default` folder

**Note**: Manual copy may skip locked files. Use Option A or B for best results.

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
USE_BRAVE=true
BRAVE_EXECUTABLE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
BRAVE_PROFILE_PATH=C:\MCP_Brave_Profile
BRAVE_SOURCE_PROFILE=C:\Users\%USERNAME%\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default

# Hot sync is enabled by default (works even when Brave is running)
HOT_SYNC_ENABLED=true
SYNC_RETRY_COUNT=5
SYNC_RETRY_DELAY=2
```

**Replace `%USERNAME%` with your actual Windows username!**

Or set environment variables in PowerShell:

```powershell
$env:USE_BRAVE="true"
$env:BRAVE_EXECUTABLE="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
$env:BRAVE_PROFILE_PATH="C:\MCP_Brave_Profile"
$env:BRAVE_SOURCE_PROFILE="$env:USERPROFILE\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default"
```

## Step 4: Test the Setup

Run the Brave-enabled MCP server:

```powershell
npm run brave
```

Or directly:

```powershell
node cli-brave.js
```

You should see:
```
[MCP-PLAYWRIGHT] 🦁 Brave mode enabled
[MCP-PLAYWRIGHT] 📝 Using Brave executable: C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
[MCP-PLAYWRIGHT] 📁 Using Brave profile: C:\MCP_Brave_Profile
```

## Step 5: Configure Your MCP Client

### For Cursor IDE

1. Open Cursor Settings (`Ctrl+,`)
2. Search for "MCP" or navigate to **Features** → **MCP**
3. Add new MCP server with this configuration:

```json
{
  "mcpServers": {
    "playwright-brave": {
      "command": "node",
      "args": [
        "C:\\path\\to\\mcp-playwright-brave\\cli-brave.js"
      ],
      "env": {
        "USE_BRAVE": "true",
        "BRAVE_EXECUTABLE": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "BRAVE_PROFILE_PATH": "C:\\MCP_Brave_Profile"
      }
    }
  }
}
```

4. Restart Cursor

### For VS Code

1. Open VS Code Settings
2. Search for "MCP" or edit settings.json
3. Add:

```json
{
  "mcp.servers": {
    "playwright-brave": {
      "command": "node",
      "args": [
        "C:\\path\\to\\mcp-playwright-brave\\cli-brave.js"
      ],
      "env": {
        "USE_BRAVE": "true",
        "BRAVE_EXECUTABLE": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "BRAVE_PROFILE_PATH": "C:\\MCP_Brave_Profile"
      }
    }
  }
}
```

## Profile Sync (Always Enabled)

Profile sync is **always enabled** by default. The MCP server will automatically sync your Brave profile before each launch to ensure you have the latest cookies, bookmarks, and extensions.

**Hot Sync (Windows)**: When Brave is running, hot sync automatically handles locked files. No need to close Brave!

**Configuration**:
```env
# Enable/disable hot sync (default: true)
HOT_SYNC_ENABLED=true

# Retry settings for locked files
SYNC_RETRY_COUNT=5
SYNC_RETRY_DELAY=2
```

## Manual Profile Sync

Profile sync happens automatically before each launch. If you need to manually sync:

```powershell
node sync-profile.js
```

**Note**: With hot sync enabled, you don't need to close Brave. The sync will handle locked files automatically.

## Troubleshooting

### Brave executable not found

- Check if Brave is installed: `Test-Path "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"`
- If installed elsewhere, update `BRAVE_EXECUTABLE` in `.env`

### Profile sync fails

- **With Hot Sync**: This shouldn't happen - hot sync handles locked files automatically
- **Without Hot Sync**: Close Brave browser completely before syncing
- Check file permissions (may need Administrator)
- Verify paths are correct
- Increase retry count: `SYNC_RETRY_COUNT=10` and `SYNC_RETRY_DELAY=3`

### Profile in use error

- **With Hot Sync**: This shouldn't happen - hot sync handles this automatically
- **Without Hot Sync**: Close all Brave processes: `taskkill /F /IM brave.exe`
- Wait a few seconds
- Try again

### MCP server won't start

- Check Node.js version: `node --version` (must be 18+)
- Verify all environment variables are set
- Check profile path exists: `Test-Path "C:\MCP_Brave_Profile"`

## Next Steps

- See [README-BRAVE.md](README-BRAVE.md) for full documentation
- Test MCP tools with your AI assistant
- Customize profile sync settings as needed

## Notes

- The profile at `C:\MCP_Brave_Profile` is a **copy** - your original profile is never modified
- You can delete `C:\MCP_Brave_Profile` at any time to start fresh
- Profile sync only copies - it never modifies your original profile
- **With Hot Sync**: No need to close Brave - sync works automatically even when Brave is running!
- **Without Hot Sync**: Keep Brave closed when syncing to avoid corruption

