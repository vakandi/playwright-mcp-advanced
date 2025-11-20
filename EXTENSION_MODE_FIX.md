# Extension Mode Fix - Always Use Brave

## Changes Made

### Problem
- Extension mode (`USE_EXTENSION=true`) was enabled but when connection failed, it fell back to launching Chrome
- User wanted to always use Brave with their real profile (cookies, extensions, bookmarks)

### Solution
Modified `cli-brave.js` to:

1. **Always get Brave config when extension mode is enabled**
   - Even if `USE_BRAVE=false`, extension mode now loads Brave configuration
   - This ensures we have Brave executable and profile paths available

2. **Pass Brave config to extension mode as fallback**
   - When `launchWithExtension()` is called, it now receives Brave config
   - Adds `--executable-path` flag with Brave executable
   - Adds `--user-data-dir` flag with real Brave profile path
   - Sets `PLAYWRIGHT_BROWSER_PATH` environment variable

3. **Fallback strategy**
   - If extension connection fails, Playwright should now use Brave instead of Chrome
   - Uses the real Brave profile: `C:\Users\vakandi\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default`
   - This gives access to all cookies, extensions, and bookmarks

## How It Works Now

1. When `USE_EXTENSION=true`:
   - First tries to connect to existing Brave browser via extension
   - If extension is installed and connects → uses existing Brave
   - If extension fails → falls back to launching Brave with real profile (not Chrome)

2. Profile used:
   - Real Brave profile: `C:\Users\vakandi\AppData\Local\BraveSoftware\Brave-Browser\User Data\Default`
   - Contains all your cookies, extensions, and bookmarks

## Testing

1. Make sure your `.env` has:
   ```
   USE_BRAVE=false
   USE_EXTENSION=true
   BRAVE_EXECUTABLE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
   ```

2. Install extension in Brave:
   - Open `brave://extensions/`
   - Enable Developer mode
   - Load unpacked: `mcp-playwright-brave\extension\dist`

3. Test:
   - Restart Cursor
   - Try navigating to a page
   - Should connect to existing Brave OR launch Brave (not Chrome)

## Expected Behavior

- **Extension installed + Brave running**: Connects to existing Brave via extension
- **Extension installed + Brave closed**: Launches Brave with real profile
- **Extension not installed**: Launches Brave with real profile (not Chrome)
- **Always uses Brave**: Never launches Chrome when `USE_EXTENSION=true`

## Notes

- The `--executable-path` and `--user-data-dir` flags might not be fully supported in Playwright's extension mode
- If extension mode doesn't respect these flags, we may need to modify Playwright MCP code
- But this should at least ensure Playwright knows to prefer Brave over Chrome

