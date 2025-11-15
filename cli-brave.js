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
try {
  require('dotenv').config();
} catch (error) {
  // dotenv not available, continue without it
}

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getBraveConfig, syncBraveProfile, validateBraveExecutable, isBraveRunning } = require('./brave-config');

// Main entry point - async to handle Brave checks and profile sync
(async () => {
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
    
    // Always sync profile before launch (hot sync will be used if Brave is running and enabled)
    // This ensures we have the latest cookies, bookmarks, and extensions
    try {
      console.log('[MCP-PLAYWRIGHT] 🔄 Syncing profile before launch...');
      await syncBraveProfile(braveConfig.sourceProfile, braveConfig.profilePath);
      console.log('[MCP-PLAYWRIGHT] ✅ Profile sync completed');
    } catch (error) {
      console.error('[MCP-PLAYWRIGHT] ❌ Failed to sync profile:', error.message);
      console.warn('[MCP-PLAYWRIGHT] ⚠️  Continuing with existing profile...');
      console.warn('[MCP-PLAYWRIGHT] ⚠️  Some features (cookies, bookmarks, extensions) may not be available.');
    }
    
    // Launch with Brave configuration
    launchWithBrave(braveConfig);
  } else {
    // Use standard Chromium
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
  
  console.log(`[MCP-PLAYWRIGHT] Using Brave executable: ${braveConfig.executable}`);
  console.log(`[MCP-PLAYWRIGHT] Using User Data directory: ${userDataDir}`);
  console.log(`[MCP-PLAYWRIGHT] Profile path: ${defaultProfilePath}`);
  
  // Verify User Data directory exists
  if (!fs.existsSync(userDataDir)) {
    console.error(`[MCP-PLAYWRIGHT] ERROR: User Data directory does not exist: ${userDataDir}`);
    console.error(`[MCP-PLAYWRIGHT] Please copy your Brave profile first. See SETUP-WINDOWS.md for instructions.`);
    console.error(`[MCP-PLAYWRIGHT] Expected structure: ${braveConfig.profilePath}\\User Data\\Default`);
    process.exit(1);
  }
  
  // Verify Default profile exists
  if (!fs.existsSync(defaultProfilePath)) {
    console.error(`[MCP-PLAYWRIGHT] ERROR: Default profile directory does not exist: ${defaultProfilePath}`);
    console.error(`[MCP-PLAYWRIGHT] Please copy your Brave profile first. See SETUP-WINDOWS.md for instructions.`);
    process.exit(1);
  }
  
  // Check for essential profile files in Default directory
  const essentialFiles = ['Preferences'];
  const optionalFiles = ['Bookmarks', 'Extensions'];
  const missingFiles = essentialFiles.filter(file => !fs.existsSync(path.join(defaultProfilePath, file)));
  const existingOptional = optionalFiles.filter(file => fs.existsSync(path.join(defaultProfilePath, file)));
  
  if (missingFiles.length > 0) {
    console.warn(`[MCP-PLAYWRIGHT] WARNING: Essential profile files are missing: ${missingFiles.join(', ')}`);
    console.warn(`[MCP-PLAYWRIGHT] Your profile may not have been copied correctly.`);
    console.warn(`[MCP-PLAYWRIGHT] Try copying your profile again while Brave is closed.`);
  } else {
    console.log(`[MCP-PLAYWRIGHT] Profile validation: OK`);
    if (existingOptional.length > 0) {
      console.log(`[MCP-PLAYWRIGHT] Found: ${existingOptional.join(', ')}`);
    }
  }
  
  // Launch the standard CLI with Brave config
  // Use both config file AND command-line args for maximum compatibility
  const args = process.argv.slice(2);
  
  // Add config file argument
  args.push('--config', configPath);
  
  // Also add user-data-dir argument directly (as backup/override)
  // Point to the User Data directory, not the Default profile
  args.push('--user-data-dir', userDataDir);
  
  // Add executable path as argument
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

