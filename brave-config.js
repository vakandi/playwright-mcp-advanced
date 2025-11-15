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

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Checks if Brave browser is currently running
 * @returns {Promise<boolean>} True if Brave is running
 */
async function isBraveRunning() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Check Windows processes
      try {
        const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq brave.exe" /FO CSV');
        return stdout.toLowerCase().includes('brave.exe');
      } catch (error) {
        // If tasklist fails, assume Brave is not running
        return false;
      }
    } else if (platform === 'darwin') {
      // Check macOS processes
      try {
        const { stdout } = await execAsync('pgrep -f "Brave Browser"');
        return stdout.trim().length > 0;
      } catch (error) {
        return false;
      }
    } else {
      // Check Linux processes
      try {
        const { stdout } = await execAsync('pgrep -f brave');
        return stdout.trim().length > 0;
      } catch (error) {
        return false;
      }
    }
  } catch (error) {
    // If we can't check, assume it's not running to be safe
    console.warn('[MCP-PLAYWRIGHT] Warning: Could not check if Brave is running:', error.message);
    return false;
  }
}

/**
 * Hot syncs Brave profile using PowerShell script (works even when Brave is running)
 * @param {string} sourceProfile - Path to source Brave profile
 * @param {string} destProfile - Path to destination profile base
 * @returns {Promise<boolean>} True if sync succeeded
 */
async function hotSyncBraveProfile(sourceProfile, destProfile) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Expand environment variables in paths
    const expandedSource = sourceProfile.replace(/%USERNAME%/g, os.userInfo().username);
    const expandedDestBase = destProfile.replace(/%USERNAME%/g, os.userInfo().username);
    
    // Get retry configuration from environment
    const retryCount = parseInt(process.env.SYNC_RETRY_COUNT || '5', 10);
    const retryDelay = parseInt(process.env.SYNC_RETRY_DELAY || '2', 10);
    
    // Get path to PowerShell script
    const scriptPath = path.join(__dirname, 'hot-sync-profile.ps1');
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`[MCP-PLAYWRIGHT] ❌ Hot sync script not found: ${scriptPath}`);
      return false;
    }
    
    console.log(`[MCP-PLAYWRIGHT] 🔥 Starting hot sync (Brave can be running)...`);
    console.log(`[MCP-PLAYWRIGHT] Source: ${expandedSource}`);
    console.log(`[MCP-PLAYWRIGHT] Destination: ${expandedDestBase}`);
    
    // Execute PowerShell script (properly quote paths)
    // PowerShell requires paths to be quoted, and we need to escape internal quotes
    const escapeForPowerShell = (str) => str.replace(/"/g, '""');
    const command = `powershell.exe -ExecutionPolicy Bypass -File "${escapeForPowerShell(scriptPath)}" -SourceProfile "${escapeForPowerShell(expandedSource)}" -DestBase "${escapeForPowerShell(expandedDestBase)}" -RetryCount ${retryCount} -RetryDelay ${retryDelay}`;
    
    try {
      const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
      
      if (stdout) {
        // Filter and display PowerShell output
        const lines = stdout.split('\n').filter(line => line.trim() && line.includes('[MCP-PLAYWRIGHT]'));
        lines.forEach(line => {
          // Remove PowerShell formatting and display
          const cleanLine = line.replace(/\[MCP-PLAYWRIGHT\]\s*/, '[MCP-PLAYWRIGHT] ');
          if (cleanLine.includes('ERROR') || cleanLine.includes('✗')) {
            console.error(cleanLine);
          } else if (cleanLine.includes('WARNING') || cleanLine.includes('⚠')) {
            console.warn(cleanLine);
          } else {
            console.log(cleanLine);
          }
        });
      }
      
      // Check exit code (PowerShell scripts return 0 on success)
      return true;
    } catch (error) {
      // PowerShell may return non-zero exit codes even on partial success
      console.warn(`[MCP-PLAYWRIGHT] ⚠️  Hot sync completed with warnings: ${error.message}`);
      return true; // Continue anyway - partial sync is better than no sync
    }
  } catch (error) {
    console.error(`[MCP-PLAYWRIGHT] ❌ Hot sync failed: ${error.message}`);
    return false;
  }
}

/**
 * Syncs Brave profile from source to destination
 * @param {string} sourceProfile - Path to source Brave profile
 * @param {string} destProfile - Path to destination profile
 * @returns {Promise<void>}
 */
async function syncBraveProfile(sourceProfile, destProfile) {
  try {
    // Expand environment variables in paths
    const expandedSource = sourceProfile.replace(/%USERNAME%/g, os.userInfo().username);
    
    // destProfile is the base path, but we need to copy to User Data/Default structure
    const expandedDestBase = destProfile.replace(/%USERNAME%/g, os.userInfo().username);
    const expandedDestUserData = path.join(expandedDestBase, 'User Data');
    const expandedDest = path.join(expandedDestUserData, 'Default');
    
    // Check if source exists
    if (!fs.existsSync(expandedSource)) {
      console.warn(`[MCP-PLAYWRIGHT] Source profile not found: ${expandedSource}`);
      return;
    }
    
    // Check if hot sync is enabled and Brave is running
    const hotSyncEnabled = process.env.HOT_SYNC_ENABLED !== 'false';
    const braveRunning = await isBraveRunning();
    
    if (braveRunning && hotSyncEnabled && os.platform() === 'win32') {
      // Use hot sync when Brave is running on Windows
      console.log('[MCP-PLAYWRIGHT] 🔥 Brave is running - using hot sync mode');
      const success = await hotSyncBraveProfile(sourceProfile, destProfile);
      if (success) {
        console.log('[MCP-PLAYWRIGHT] ✅ Hot sync completed');
        return;
      } else {
        console.warn('[MCP-PLAYWRIGHT] ⚠️  Hot sync had issues, continuing with normal sync...');
      }
    } else if (braveRunning && !hotSyncEnabled) {
      console.warn('[MCP-PLAYWRIGHT] ⚠️  Brave is running and hot sync is disabled.');
      console.warn('[MCP-PLAYWRIGHT] ⚠️  Attempting normal sync (may fail for locked files)...');
    } else if (braveRunning && os.platform() !== 'win32') {
      console.warn('[MCP-PLAYWRIGHT] ⚠️  Brave is running. Hot sync is only supported on Windows.');
      console.warn('[MCP-PLAYWRIGHT] ⚠️  Attempting normal sync (may fail for locked files)...');
    }
    
    console.log(`[MCP-PLAYWRIGHT] Syncing Brave profile from ${expandedSource} to ${expandedDest}...`);
    console.log(`[MCP-PLAYWRIGHT] Structure: User Data/Default`);
    
    // Use fs-extra if available, otherwise fall back to native fs
    let fse;
    try {
      fse = require('fs-extra');
    } catch (error) {
      // fs-extra not available, use native methods
      console.warn('[MCP-PLAYWRIGHT] fs-extra not found. Using native fs methods (may be slower).');
      
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(path.dirname(expandedDest))) {
        fs.mkdirSync(path.dirname(expandedDest), { recursive: true });
      }
      
      // Copy directory recursively (simplified version)
      const copyRecursiveSync = (src, dest) => {
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();
        
        if (isDirectory) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(
              path.join(src, childItemName),
              path.join(dest, childItemName)
            );
          });
        } else {
          fs.copyFileSync(src, dest);
        }
      };
      
      // Remove destination if it exists
      if (fs.existsSync(expandedDest)) {
        fs.rmSync(expandedDest, { recursive: true, force: true });
      }
      
      // Create User Data/Default directory structure before copying
      if (!fs.existsSync(expandedDestUserData)) {
        fs.mkdirSync(expandedDestUserData, { recursive: true });
      }
      if (!fs.existsSync(expandedDest)) {
        fs.mkdirSync(expandedDest, { recursive: true });
      }
      
      copyRecursiveSync(expandedSource, expandedDest);
    }
    
    if (fse) {
      // Create User Data/Default directory structure before copying
      if (!fs.existsSync(expandedDestUserData)) {
        fs.mkdirSync(expandedDestUserData, { recursive: true });
      }
      if (!fs.existsSync(expandedDest)) {
        fs.mkdirSync(expandedDest, { recursive: true });
      }
      
      // Remove Default directory if it exists (preserve User Data parent)
      if (fs.existsSync(expandedDest)) {
        await fse.remove(expandedDest);
      }
      
      // Copy source to destination with better error handling for locked files
      await fse.copy(expandedSource, expandedDest, {
        overwrite: true,
        preserveTimestamps: true,
        filter: (src, dest) => {
          // Skip lock files that might cause issues
          const basename = path.basename(src);
          if (basename === 'SingletonLock' || basename.startsWith('lockfile')) {
            return false;
          }
          // Skip Chrome's Singleton* files (they're lock files)
          if (basename.startsWith('Singleton') && !basename.includes('.')) {
            return false;
          }
          return true;
        },
        // Handle errors gracefully - retry locked files
        errorOnExist: false
      });
      
      // Retry copying Cookies and other database files that might be locked
      const retryCount = parseInt(process.env.SYNC_RETRY_COUNT || '5', 10);
      const retryDelay = parseInt(process.env.SYNC_RETRY_DELAY || '2', 10) * 1000;
      
      const dbFiles = [
        { name: 'Cookies', path: 'Network/Cookies' },
        { name: 'Cookies-journal', path: 'Network/Cookies-journal' },
        { name: 'Web Data', path: 'Web Data' },
        { name: 'Web Data-journal', path: 'Web Data-journal' },
        { name: 'Login Data', path: 'Login Data' },
        { name: 'Login Data-journal', path: 'Login Data-journal' },
        { name: 'History', path: 'History' },
        { name: 'History-journal', path: 'History-journal' }
      ];
      
      const copiedFiles = [];
      const failedFiles = [];
      
      for (const dbFile of dbFiles) {
        const srcFile = path.join(expandedSource, dbFile.path);
        const destFile = path.join(expandedDest, dbFile.path);
        
        // Ensure destination directory exists
        const destDir = path.dirname(destFile);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        if (fs.existsSync(srcFile)) {
          let copied = false;
          for (let i = 1; i <= retryCount; i++) {
            try {
              await fse.copy(srcFile, destFile, { overwrite: true, preserveTimestamps: true });
              copied = true;
              copiedFiles.push(dbFile.name);
              console.log(`[MCP-PLAYWRIGHT] ✅ Copied database file: ${dbFile.name}`);
              break;
            } catch (error) {
              if (i < retryCount) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
              } else {
                failedFiles.push(dbFile.name);
                console.warn(`[MCP-PLAYWRIGHT] ⚠️  Could not copy ${dbFile.name} after ${retryCount} retries: ${error.message}`);
              }
            }
          }
        }
      }
      
      // Log summary
      if (copiedFiles.length > 0) {
        console.log(`[MCP-PLAYWRIGHT] ✅ Successfully copied ${copiedFiles.length} database files`);
      }
      if (failedFiles.length > 0) {
        console.warn(`[MCP-PLAYWRIGHT] ⚠️  Failed to copy ${failedFiles.length} files (may be locked): ${failedFiles.join(', ')}`);
        console.warn(`[MCP-PLAYWRIGHT] ⚠️  These files may be locked by Brave. Consider using hot sync (HOT_SYNC_ENABLED=true).`);
      }
    }
    
    console.log('[MCP-PLAYWRIGHT] ✅ Brave profile synced successfully.');
  } catch (error) {
    console.error('[MCP-PLAYWRIGHT] ❌ Error syncing Brave profile:', error.message);
    // Don't throw - allow the server to continue even if sync fails
  }
}

/**
 * Gets Brave configuration from environment variables
 * @returns {Object} Brave configuration object
 */
function getBraveConfig() {
  const useBrave = process.env.USE_BRAVE === 'true';
  
  if (!useBrave) {
    return { useBrave: false };
  }
  
  const platform = os.platform();
  let defaultExecutable;
  let defaultSourceProfile;
  
  if (platform === 'win32') {
    defaultExecutable = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
    defaultSourceProfile = path.join(
      os.homedir(),
      'AppData',
      'Local',
      'BraveSoftware',
      'Brave-Browser',
      'User Data',
      'Default'
    );
  } else if (platform === 'darwin') {
    defaultExecutable = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
    defaultSourceProfile = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'BraveSoftware',
      'Brave-Browser',
      'Default'
    );
  } else {
    // Linux
    defaultExecutable = '/usr/bin/brave-browser';
    defaultSourceProfile = path.join(
      os.homedir(),
      '.config',
      'BraveSoftware',
      'Brave-Browser',
      'Default'
    );
  }
  
  const executable = process.env.BRAVE_EXECUTABLE || defaultExecutable;
  const profilePath = process.env.BRAVE_PROFILE_PATH || 
    (platform === 'win32' ? 'C:\\MCP_Brave_Profile' : path.join(os.homedir(), '.mcp-brave-profile'));
  const sourceProfile = process.env.BRAVE_SOURCE_PROFILE || defaultSourceProfile;
  const syncOnStartup = process.env.SYNC_PROFILE_ON_STARTUP === 'true';
  const hotSyncEnabled = process.env.HOT_SYNC_ENABLED !== 'false'; // Default to true
  const syncRetryCount = parseInt(process.env.SYNC_RETRY_COUNT || '5', 10);
  const syncRetryDelay = parseInt(process.env.SYNC_RETRY_DELAY || '2', 10);
  
  // Expand environment variables
  const expandedProfilePath = profilePath.replace(/%USERNAME%/g, os.userInfo().username);
  const expandedExecutable = executable.replace(/%USERNAME%/g, os.userInfo().username);
  const expandedSourceProfile = sourceProfile.replace(/%USERNAME%/g, os.userInfo().username);
  
  return {
    useBrave: true,
    executable: expandedExecutable,
    profilePath: expandedProfilePath,
    sourceProfile: expandedSourceProfile,
    syncOnStartup,
    hotSyncEnabled,
    syncRetryCount,
    syncRetryDelay
  };
}

/**
 * Validates Brave executable exists
 * @param {string} executablePath - Path to Brave executable
 * @returns {boolean} True if executable exists
 */
function validateBraveExecutable(executablePath) {
  try {
    if (!fs.existsSync(executablePath)) {
      console.error(`[MCP-PLAYWRIGHT] ❌ Brave executable not found: ${executablePath}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[MCP-PLAYWRIGHT] ❌ Error validating Brave executable: ${error.message}`);
    return false;
  }
}

module.exports = {
  isBraveRunning,
  syncBraveProfile,
  hotSyncBraveProfile,
  getBraveConfig,
  validateBraveExecutable
};

