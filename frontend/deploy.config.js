/**
 * Deployment configuration for SnapRate frontend
 * This file contains configuration for different deployment environments
 */

module.exports = {
  // Production deployment configuration
  production: {
    // Deployment target (vercel, netlify, aws-s3, etc.)
    target: 'vercel',
    // Base URL for the frontend
    baseUrl: 'https://snaprate.example.com',
    // API URL for the backend
    apiUrl: 'https://api.snaprate.example.com',
    // Build command
    buildCommand: 'yarn build:prod',
    // Output directory
    outputDir: 'dist',
    // Environment variables to set during build
    env: {
      VITE_NODE_ENV: 'production',
      VITE_ENABLE_PWA: 'true',
      VITE_ENABLE_ANALYTICS: 'true',
    },
    // Headers to set on the deployment
    headers: [
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ],
  },
  
  // Staging deployment configuration
  staging: {
    target: 'vercel',
    baseUrl: 'https://staging.snaprate.example.com',
    apiUrl: 'https://api-staging.snaprate.example.com',
    buildCommand: 'yarn build --mode staging',
    outputDir: 'dist',
    env: {
      VITE_NODE_ENV: 'staging',
      VITE_ENABLE_PWA: 'true',
      VITE_ENABLE_ANALYTICS: 'true',
    },
    headers: [
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ],
  },
  
  // Development deployment configuration (for testing)
  development: {
    target: 'local',
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:8000',
    buildCommand: 'yarn build',
    outputDir: 'dist',
    env: {
      VITE_NODE_ENV: 'development',
      VITE_ENABLE_PWA: 'false',
      VITE_ENABLE_ANALYTICS: 'false',
    },
  },
  
  // Deployment targets configuration
  targets: {
    // Vercel deployment configuration
    vercel: {
      // Team or user scope
      scope: 'snaprate',
      // Project name
      project: 'snaprate-frontend',
      // Regions to deploy to
      regions: ['sfo1', 'iad1', 'cdg1'],
      // Framework preset
      framework: 'vite',
    },
    
    // Netlify deployment configuration
    netlify: {
      // Site name
      site: 'snaprate-frontend',
      // Team name
      team: 'snaprate',
    },
    
    // AWS S3 deployment configuration
    'aws-s3': {
      // S3 bucket name
      bucket: 'snaprate-frontend',
      // CloudFront distribution ID
      distribution: 'E1234567890ABCDEF',
      // AWS region
      region: 'us-west-2',
    },
  },
};