#!/usr/bin/env node

/**
 * Environment validation script for SnapRate frontend
 * This script validates environment configuration before deployment
 * 
 * Usage:
 *   node scripts/validate-env.js [environment]
 * 
 * Environments:
 *   - production
 *   - staging
 *   - development
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'production';

// Logging utility
const log = (message, level = 'info') => {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[level] || 'ℹ️';
  
  console.log(`${prefix} ${message}`);
};

// Environment file mapping
const envFiles = {
  production: '.env.production',
  staging: '.env.staging',
  development: '.env.example'
};

// Required environment variables for each environment
const requiredVars = {
  production: [
    'VITE_API_BASE_URL',
    'VITE_NODE_ENV',
    'VITE_ENABLE_PWA',
    'VITE_ENABLE_ANALYTICS'
  ],
  staging: [
    'VITE_API_BASE_URL',
    'VITE_NODE_ENV',
    'VITE_ENABLE_PWA'
  ],
  development: [
    'VITE_API_BASE_URL',
    'VITE_NODE_ENV'
  ]
};

// URL validation patterns
const urlPattern = /^https?:\/\/.+/;
const httpsPattern = /^https:\/\/.+/;

log(`🔍 Validating environment configuration for: ${environment}`);

try {
  // Step 1: Check if environment file exists
  const envFile = envFiles[environment];
  if (!envFile) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  const envPath = path.join(rootDir, envFile);
  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envFile}`);
  }

  log(`Found environment file: ${envFile}`, 'success');

  // Step 2: Parse environment file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=');
      }
    }
  });

  log(`Parsed ${Object.keys(envVars).length} environment variables`);

  // Step 3: Validate required variables
  const required = requiredVars[environment] || [];
  const missing = [];
  const invalid = [];

  for (const varName of required) {
    if (!envVars[varName]) {
      missing.push(varName);
    } else {
      // Validate specific variable types
      const value = envVars[varName];
      
      if (varName.includes('URL') || varName.includes('_BASE_URL')) {
        if (!urlPattern.test(value)) {
          invalid.push(`${varName}: Invalid URL format`);
        } else if (environment === 'production' && !httpsPattern.test(value)) {
          invalid.push(`${varName}: Production URLs must use HTTPS`);
        }
      }
      
      if (varName === 'VITE_NODE_ENV' && value !== environment) {
        invalid.push(`${varName}: Should be "${environment}" but is "${value}"`);
      }
      
      if (varName.includes('ENABLE_') && !['true', 'false'].includes(value)) {
        invalid.push(`${varName}: Should be "true" or "false" but is "${value}"`);
      }
    }
  }

  // Step 4: Report validation results
  if (missing.length > 0) {
    log('Missing required environment variables:', 'error');
    missing.forEach(varName => log(`  - ${varName}`, 'error'));
  }

  if (invalid.length > 0) {
    log('Invalid environment variable values:', 'error');
    invalid.forEach(issue => log(`  - ${issue}`, 'error'));
  }

  if (missing.length > 0 || invalid.length > 0) {
    throw new Error('Environment validation failed');
  }

  // Step 5: Environment-specific validations
  if (environment === 'production') {
    validateProductionEnvironment(envVars);
  }

  log('Environment validation passed successfully!', 'success');
  
  // Step 6: Display configuration summary
  displayConfigSummary(envVars, environment);

} catch (error) {
  log(`Environment validation failed: ${error.message}`, 'error');
  process.exit(1);
}

/**
 * Validate production-specific requirements
 */
function validateProductionEnvironment(envVars) {
  log('Running production-specific validations...');

  // Check that PWA is enabled in production
  if (envVars.VITE_ENABLE_PWA !== 'true') {
    log('Warning: PWA should be enabled in production', 'warning');
  }

  // Check that analytics is enabled in production
  if (envVars.VITE_ENABLE_ANALYTICS !== 'true') {
    log('Warning: Analytics should be enabled in production', 'warning');
  }

  // Check that debug logging is disabled in production
  if (envVars.VITE_ENABLE_DEBUG_LOGGING === 'true') {
    log('Warning: Debug logging should be disabled in production', 'warning');
  }

  // Check that mock API is disabled in production
  if (envVars.VITE_USE_MOCK_API === 'true') {
    throw new Error('Mock API must be disabled in production');
  }

  // Validate image compression settings
  const compressionQuality = parseFloat(envVars.VITE_IMAGE_COMPRESSION_QUALITY || '0.8');
  if (compressionQuality > 0.9) {
    log('Warning: Image compression quality is high, consider reducing for better performance', 'warning');
  }

  // Validate max image size
  const maxImageSize = parseInt(envVars.VITE_MAX_IMAGE_SIZE || '5242880');
  if (maxImageSize > 10485760) { // 10MB
    log('Warning: Max image size is large, consider reducing for better performance', 'warning');
  }

  log('Production validations completed', 'success');
}

/**
 * Display configuration summary
 */
function displayConfigSummary(envVars, environment) {
  log('\n📋 Configuration Summary:');
  log(`Environment: ${environment}`);
  log(`API URL: ${envVars.VITE_API_BASE_URL || 'Not set'}`);
  log(`PWA Enabled: ${envVars.VITE_ENABLE_PWA || 'false'}`);
  log(`Analytics Enabled: ${envVars.VITE_ENABLE_ANALYTICS || 'false'}`);
  log(`Advanced AI: ${envVars.VITE_ENABLE_ADVANCED_AI || 'false'}`);
  
  if (envVars.VITE_IMAGE_COMPRESSION_QUALITY) {
    log(`Image Quality: ${envVars.VITE_IMAGE_COMPRESSION_QUALITY}`);
  }
  
  if (envVars.VITE_MAX_IMAGE_SIZE) {
    const sizeMB = (parseInt(envVars.VITE_MAX_IMAGE_SIZE) / 1048576).toFixed(1);
    log(`Max Image Size: ${sizeMB}MB`);
  }
}