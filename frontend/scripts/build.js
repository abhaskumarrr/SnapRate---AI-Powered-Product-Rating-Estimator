#!/usr/bin/env node

/**
 * Build script for SnapRate frontend
 * This script builds the frontend for different environments
 * 
 * Usage:
 *   node scripts/build.js [environment] [options]
 * 
 * Environments:
 *   - production (default)
 *   - staging
 *   - development
 * 
 * Options:
 *   --analyze    Generate bundle analysis report
 *   --no-tests   Skip running tests
 *   --no-lint    Skip linting
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
const environment = args.find(arg => !arg.startsWith('--')) || 'production';
const analyze = args.includes('--analyze');
const skipTests = args.includes('--no-tests');
const skipLint = args.includes('--no-lint');

// Load deployment config
const deployConfig = require(path.join(rootDir, 'deploy.config.js'));
const config = deployConfig[environment];

if (!config) {
  console.error(`❌ Unknown environment: ${environment}`);
  console.error('Available environments: production, staging, development');
  process.exit(1);
}

console.log(`🚀 Building SnapRate frontend for ${environment} environment...`);

// Set environment variables from config
Object.entries(config.env || {}).forEach(([key, value]) => {
  process.env[key] = value;
});

// Ensure we're in the project root
process.chdir(rootDir);

try {
  // Run linting if not skipped
  if (!skipLint) {
    console.log('🔍 Running linter...');
    execSync('yarn lint', { stdio: 'inherit' });
  }

  // Run tests if not skipped
  if (!skipTests) {
    console.log('🧪 Running tests...');
    execSync('yarn test:run', { stdio: 'inherit' });
  }

  // Build the application
  console.log(`🏗️ Building application for ${environment}...`);
  
  let buildCommand = `yarn vite build --mode ${environment}`;
  if (analyze) {
    buildCommand = 'yarn build:analyze';
  }
  
  execSync(buildCommand, { stdio: 'inherit' });

  // Run post-build optimizations
  console.log('✨ Running post-build optimizations...');
  execSync('node scripts/optimize-dist.js', { stdio: 'inherit' });

  console.log(`✅ Build completed successfully for ${environment} environment!`);
  console.log(`📁 Output directory: ${config.outputDir}`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}