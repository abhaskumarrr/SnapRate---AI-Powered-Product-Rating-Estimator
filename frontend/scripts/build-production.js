#!/usr/bin/env node

/**
 * Enhanced production build script for SnapRate frontend
 * This script performs comprehensive optimizations for production deployment
 * 
 * Usage:
 *   node scripts/build-production.js [options]
 * 
 * Options:
 *   --skip-tests     Skip running tests
 *   --skip-lint      Skip linting
 *   --analyze        Generate bundle analysis
 *   --verbose        Enable verbose logging
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');
const skipLint = args.includes('--skip-lint');
const analyze = args.includes('--analyze');
const verbose = args.includes('--verbose');

// Logging utility
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '🔵',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const debugLog = (message) => {
  if (verbose) {
    log(message, 'debug');
  }
};

// Ensure we're in the project root
process.chdir(rootDir);

log('🚀 Starting enhanced production build for SnapRate frontend...');

try {
  // Step 1: Clean previous builds
  log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist', { stdio: verbose ? 'inherit' : 'pipe' });
  }
  if (fs.existsSync('node_modules/.vite')) {
    execSync('rm -rf node_modules/.vite', { stdio: verbose ? 'inherit' : 'pipe' });
  }
  debugLog('Build directories cleaned');

  // Step 2: Install dependencies if needed
  log('📦 Checking dependencies...');
  if (!fs.existsSync('node_modules')) {
    log('Installing dependencies...');
    execSync('yarn install --frozen-lockfile', { stdio: 'inherit' });
  }
  debugLog('Dependencies verified');

  // Step 3: Run linting if not skipped
  if (!skipLint) {
    log('🔍 Running linter...');
    try {
      execSync('yarn lint:fix', { stdio: verbose ? 'inherit' : 'pipe' });
      log('Linting completed successfully', 'success');
    } catch (error) {
      log('Linting failed - continuing with build', 'warning');
      if (verbose) {
        console.error(error.message);
      }
    }
  } else {
    log('Skipping linting as requested', 'warning');
  }

  // Step 4: Run tests if not skipped
  if (!skipTests) {
    log('🧪 Running tests...');
    try {
      execSync('yarn test:run', { stdio: verbose ? 'inherit' : 'pipe' });
      log('Tests completed successfully', 'success');
    } catch (error) {
      log('Tests failed - aborting build', 'error');
      throw error;
    }
  } else {
    log('Skipping tests as requested', 'warning');
  }

  // Step 5: Build the application
  log('🏗️ Building application for production...');
  
  const buildStartTime = Date.now();
  
  let buildCommand = 'yarn vite build --mode production';
  if (analyze) {
    buildCommand = 'yarn build:analyze';
    log('Bundle analysis will be generated', 'info');
  }
  
  execSync(buildCommand, { stdio: 'inherit' });
  
  const buildTime = ((Date.now() - buildStartTime) / 1000).toFixed(2);
  log(`Build completed in ${buildTime}s`, 'success');

  // Step 6: Run post-build optimizations
  log('✨ Running post-build optimizations...');
  execSync('node scripts/optimize-dist.js', { stdio: verbose ? 'inherit' : 'pipe' });
  log('Post-build optimizations completed', 'success');

  // Step 7: Generate build report
  log('📊 Generating build report...');
  generateBuildReport();

  // Step 8: Validate build output
  log('🔍 Validating build output...');
  validateBuildOutput();

  log('🎉 Production build completed successfully!', 'success');
  log(`📁 Output directory: ${path.resolve('dist')}`);
  
  if (analyze) {
    log('📈 Bundle analysis available at: dist/stats.html');
  }
  
} catch (error) {
  log(`Build failed: ${error.message}`, 'error');
  process.exit(1);
}

/**
 * Generate a comprehensive build report
 */
function generateBuildReport() {
  const distDir = path.resolve('dist');
  
  if (!fs.existsSync(distDir)) {
    log('Dist directory not found, skipping build report', 'warning');
    return;
  }

  const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = getDirectorySize(distDir);
  const files = fs.readdirSync(distDir, { recursive: true });
  const jsFiles = files.filter(f => f.endsWith('.js')).length;
  const cssFiles = files.filter(f => f.endsWith('.css')).length;
  const imageFiles = files.filter(f => /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(f)).length;

  const report = {
    timestamp: new Date().toISOString(),
    totalSize: formatBytes(totalSize),
    totalSizeBytes: totalSize,
    fileCount: files.length,
    breakdown: {
      javascript: jsFiles,
      css: cssFiles,
      images: imageFiles,
      other: files.length - jsFiles - cssFiles - imageFiles
    }
  };

  // Write build report
  fs.writeFileSync(
    path.join(distDir, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );

  log(`Build size: ${report.totalSize} (${report.fileCount} files)`, 'info');
  debugLog(`JS files: ${jsFiles}, CSS files: ${cssFiles}, Images: ${imageFiles}`);
}

/**
 * Validate the build output
 */
function validateBuildOutput() {
  const distDir = path.resolve('dist');
  const requiredFiles = ['index.html', 'manifest.json'];
  const requiredDirs = ['assets'];

  // Check required files
  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }

  // Check required directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(distDir, dir);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Required directory missing: ${dir}`);
    }
  }

  // Validate index.html
  const indexPath = path.join(distDir, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  if (!indexContent.includes('<div id="root">')) {
    throw new Error('index.html missing root div');
  }

  if (!indexContent.includes('SnapRate')) {
    log('Warning: index.html may be missing title', 'warning');
  }

  log('Build output validation passed', 'success');
}