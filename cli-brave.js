#!/usr/bin/env node
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Load environment variables from .env file if it exists
// Try multiple locations: current dir, parent dir (project root), and mcp-playwright-brave dir
try {
  const path = require('path');
  const fs = require('fs');
  const os = require('os');
  
  // Try current directory first
  let envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    // Try parent directory (project root)
    envPath = path.join(process.cwd(), '..', '.env');
  }
  if (!fs.existsSync(envPath)) {
    // Try mcp-playwright-brave directory
    envPath = path.join(__dirname, '.env');
  }
  if (!fs.existsSync(envPath)) {
    // Try user's home directory
    envPath = path.join(os.homedir(), '.env');
  }
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`[MCP-PLAYWRIGHT] 📄 Loaded .env from: ${envPath}`);
  } else {
    console.log('[MCP-PLAYWRIGHT] ⚠️  No .env file found - using environment variables only');
  }
} catch (error) {
  // dotenv not available or error loading, continue without it
  console.log('[MCP-PLAYWRIGHT] ⚠️  Could not load .env file:', error.message);
}

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getBraveConfig, syncBraveProfile, validateBraveExecutable, isBraveRunning } = require('./brave-config');

// Main entry point - async to handle Brave checks and profile sync
(async () => {
  // Check if extension mode is requested FIRST (before any Brave setup)
  // Extension mode takes priority - it connects to existing browser, no new instance needed
  const useExtensionEnv = process.env.USE_EXTENSION === 'true';
  const useExtensionArg = process.argv.includes('--extension');
  const useExtension = useExtensionEnv || useExtensionArg;
  
  if (useExtension) {
    // Extension mode: Connect to existing browser - no setup needed!
    // BUT: Get Brave config anyway for fallback if extension fails
    // This ensures we always use Brave, never Chrome
    console.log('[MCP-PLAYWRIGHT] 🔌 Extension mode: Connecting to existing browser');
    console.log('[MCP-PLAYWRIGHT] 🔌 No new browser instance will be launched');
    console.log('[MCP-PLAYWRIGHT] 🔌 Make sure the Playwright MCP Bridge extension is installed in Brave');
    console.log(`[MCP-PLAYWRIGHT] 🔌 USE_EXTENSION env: ${useExtensionEnv}, --extension arg: ${useExtensionArg}`);
    
    // Get Brave config for fallback (even if USE_BRAVE=false)
    // This ensures we fall back to Brave, not Chrome, if extension fails
    let braveConfig = null;
    try {
      // Force get Brave config even if USE_BRAVE=false
      const originalUseBrave = process.env.USE_BRAVE;
      process.env.USE_BRAVE = 'true'; // Temporarily enable to get config
      braveConfig = getBraveConfig();
      process.env.USE_BRAVE = originalUseBrave; // Restore
      
      // Verify Brave executable exists
      if (braveConfig.useBrave && validateBraveExecutable(braveConfig.executable)) {
        console.log('[MCP-PLAYWRIGHT] 🔌 Brave config loaded for fallback');
        launchWithExtension(braveConfig);
      } else {
        console.log('[MCP-PLAYWRIGHT] ⚠️  Brave executable not found, using extension mode only');
        launchWithExtension(null);
      }
    } catch (error) {
      console.log('[MCP-PLAYWRIGHT] ⚠️  Could not load Brave config:', error.message);
      launchWithExtension(null);
    }
    return;
  }
  
  // Get Brave configuration from environment
  const braveConfig = getBraveConfig();

  // If Brave is enabled, prepare the configuration
  if (braveConfig.useBrave) {
    console.log('[MCP-PLAYWRIGHT] 🦁 Brave mode enabled');
    
    // Check if Brave executable exists
    if (!validateBraveExecutable(braveConfig.executable)) {
      console.error('[MCP-PLAYWRIGHT] ❌ Brave executable not found. Please set BRAVE_EXECUTABLE environment variable or install Brave browser.');
      process.exit(1);
    }
    
    // Check if Brave is already running (non-blocking)
    let braveRunning = false;
    try {
      braveRunning = await isBraveRunning();
      if (braveRunning) {
        console.log('[MCP-PLAYWRIGHT] ℹ️  Brave browser is running - will use hot sync if enabled');
      }
    } catch (error) {
      // Ignore errors checking if Brave is running
    }
    
    // Check if we should use the REAL profile directly (when Brave is closed)
    // This gives us all cookies/extensions without syncing
    if (!braveRunning) {
      // Brave is closed - use the REAL profile directly!
      console.log('[MCP-PLAYWRIGHT] 🎯 Brave is closed - using REAL profile directly');
      console.log('[MCP-PLAYWRIGHT] 🎯 This gives you all cookies, extensions, and bookmarks!');
      braveConfig.profilePath = path.dirname(path.dirname(braveConfig.sourceProfile)); // Go up to "User Data"
      launchWithBrave(braveConfig);
    } else {
      // Brave is running - sync profile
      console.log('[MCP-PLAYWRIGHT] 🔄 Brave is running - syncing profile');
      await syncBraveProfile(braveConfig.sourceProfile, braveConfig.profilePath);
      launchWithBrave(braveConfig);
    }
  } else {
    // Use standard Chromium
    // NOTE: If extension mode was requested but failed, we should have already handled it above
    // This branch only runs if USE_EXTENSION is false
    launchStandard();
  }
})();

/**
 * Launch MCP server with Brave browser configuration
 */
function launchWithBrave(braveConfig) {
  // Create a temporary config file for Brave
  const configDir = path.join(os.tmpdir(), 'playwright-mcp-brave');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // IMPORTANT: For Playwright launchPersistentContext, userDataDir should point to the 
  // parent "User Data" directory, not the "Default" profile directory.
  // Playwright will automatically use the "Default" profile from within User Data.
  
  // Profile structure: {profilePath}/User Data/Default
  const userDataDir = path.join(braveConfig.profilePath, 'User Data');
  const defaultProfilePath = path.join(userDataDir, 'Default');
  
  const configPath = path.join(configDir, 'brave-config.json');
  const config = {
    browser: {
      browserName: 'chromium',
      // userDataDir points to the parent "User Data" directory
      // Playwright will use the "Default" profile from within it
      userDataDir: userDataDir,
      launchOptions: {
        executablePath: braveConfig.executable,
        headless: false,
        channel: undefined // Don't use channel, use executablePath instead
      }
    }
  };
  
  // Write config file
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  // Verify profile exists and has essential files
  if (!fs.existsSync(defaultProfilePath)) {
    console.error(`[MCP-PLAYWRIGHT] ERROR: Profile directory does not exist: ${defaultProfilePath}`);
    process.exit(1);
  }
  
  // Ensure Preferences file exists (required for profile to work)
  const preferencesPath = path.join(defaultProfilePath, 'Preferences');
  if (!fs.existsSync(preferencesPath)) {
    console.error(`[MCP-PLAYWRIGHT] ERROR: Preferences file missing. Profile sync may have failed.`);
    process.exit(1);
  }
  
  // Launch the standard CLI with Brave config
  // Use both config file AND command-line args for maximum compatibility
  const args = process.argv.slice(2);
  
  // Profile mode: Use synced profile
  // Add config file argument
  args.push('--config', configPath);
  
  // Also add user-data-dir argument directly (as backup/override)
  // Point to the User Data directory, not the Default profile
  args.push('--user-data-dir', userDataDir);
  
  // Add executable path as argument (Playwright MCP supports this)
  args.push('--executable-path', braveConfig.executable);
  
  // Import and run the standard CLI
  const { program } = require('playwright-core/lib/utilsBundle');
  const { decorateCommand } = require('playwright/lib/mcp/program');
  const packageJSON = require('./package.json');
  
  const p = program.version('Version ' + packageJSON.version + ' (Brave Edition)').name('Playwright MCP (Brave)');
  decorateCommand(p, packageJSON.version);
  
  // Update process.argv to include the config argument
  process.argv = [process.argv[0], process.argv[1], ...args];
  
  void program.parseAsync(process.argv);
}

/**
 * Launch MCP server with extension mode (connects to existing browser)
 * @param {Object|null} braveConfig - Brave configuration for fallback if extension fails
 */
function launchWithExtension(braveConfig) {
  // IMPORTANT: Update process.argv BEFORE importing Playwright CLI
  // This ensures the --extension flag is available when the CLI initializes
  const args = process.argv.slice(2);
  
  // Add extension flag if not already present
  if (!args.includes('--extension')) {
    args.push('--extension');
    console.log('[MCP-PLAYWRIGHT] 🔌 Added --extension flag to arguments');
  }
  
  // If we have Brave config, add it as fallback
  // This ensures if extension fails, Playwright uses Brave instead of Chrome
  if (braveConfig && braveConfig.useBrave && braveConfig.executable) {
    // Add Brave executable path so Playwright knows to use Brave if extension fails
    if (!args.includes('--executable-path')) {
      args.push('--executable-path', braveConfig.executable);
      console.log('[MCP-PLAYWRIGHT] 🔌 Added Brave executable path for fallback');
    }
    
    // Also set environment variable for Playwright to use Brave
    process.env.PLAYWRIGHT_BROWSER_PATH = braveConfig.executable;
    
    // If Brave is closed, we can also provide the real profile path
    // This way if extension fails AND Brave is closed, it will use the real profile
    const fs = require('fs');
    const userDataDir = path.dirname(path.dirname(braveConfig.sourceProfile)); // Go up to "User Data"
    const defaultProfilePath = path.join(userDataDir, 'Default');
    
    if (fs.existsSync(defaultProfilePath)) {
      // Set user data dir so if extension fails, it uses real Brave profile
      if (!args.includes('--user-data-dir')) {
        args.push('--user-data-dir', userDataDir);
        console.log('[MCP-PLAYWRIGHT] 🔌 Added real Brave profile path for fallback');
      }
    }
  }
  
  // Update process.argv BEFORE importing Playwright modules
  process.argv = [process.argv[0], process.argv[1], ...args];
  console.log('[MCP-PLAYWRIGHT] 🔌 Updated process.argv:', process.argv);
  
  // Import and run the standard CLI
  const { program } = require('playwright-core/lib/utilsBundle');
  const { decorateCommand } = require('playwright/lib/mcp/program');
  const packageJSON = require('./package.json');
  
  const p = program.version('Version ' + packageJSON.version + ' (Extension Mode)').name('Playwright MCP (Extension)');
  decorateCommand(p, packageJSON.version);
  
  void program.parseAsync(process.argv);
}

/**
 * Launch MCP server with standard Chromium configuration
 */
function launchStandard() {
  console.log('[MCP-PLAYWRIGHT] Using standard Chromium');
  
  // Import and run the standard CLI
  const { program } = require('playwright-core/lib/utilsBundle');
  const { decorateCommand } = require('playwright/lib/mcp/program');
  const packageJSON = require('./package.json');
  
  const p = program.version('Version ' + packageJSON.version).name('Playwright MCP');
  decorateCommand(p, packageJSON.version);
  
  void program.parseAsync(process.argv);
}

