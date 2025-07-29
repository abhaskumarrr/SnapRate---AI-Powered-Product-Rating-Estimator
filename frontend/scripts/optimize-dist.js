/**
 * Post-build optimization script
 * This script runs after the build process to perform additional optimizations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

console.log('🔍 Running post-build optimizations...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Dist directory not found!');
  process.exit(1);
}

/**
 * Create a cache manifest file for additional caching
 */
function createCacheManifest() {
  console.log('📝 Creating cache manifest...');
  
  try {
    // Get all files in dist directory recursively
    const getFilesRecursively = (dir) => {
      let files = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files = files.concat(getFilesRecursively(fullPath));
        } else {
          // Get path relative to dist directory
          const relativePath = path.relative(distDir, fullPath);
          // Skip source maps and existing cache files
          if (!relativePath.endsWith('.map') && 
              !relativePath.includes('cache-manifest') &&
              !relativePath.includes('sw.js') &&
              !relativePath.includes('workbox-')) {
            files.push('/' + relativePath.replace(/\\/g, '/'));
          }
        }
      }
      
      return files;
    };
    
    const files = getFilesRecursively(distDir);
    
    // Create cache manifest content
    const timestamp = new Date().toISOString();
    const manifestContent = {
      version: timestamp,
      files: files
    };
    
    // Write manifest file
    fs.writeFileSync(
      path.join(distDir, 'cache-manifest.json'),
      JSON.stringify(manifestContent, null, 2)
    );
    
    console.log(`✅ Cache manifest created with ${files.length} files`);
  } catch (error) {
    console.error('❌ Error creating cache manifest:', error);
  }
}

/**
 * Create a robots.txt file if it doesn't exist
 */
function createRobotsTxt() {
  console.log('🤖 Creating robots.txt...');
  
  const robotsPath = path.join(distDir, 'robots.txt');
  
  if (!fs.existsSync(robotsPath)) {
    const content = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
`;
    
    fs.writeFileSync(robotsPath, content);
    console.log('✅ robots.txt created');
  } else {
    console.log('ℹ️ robots.txt already exists');
  }
}

/**
 * Create a .htaccess file for Apache servers
 */
function createHtaccess() {
  console.log('📄 Creating .htaccess...');
  
  const htaccessPath = path.join(distDir, '.htaccess');
  
  const content = `# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json application/xml
</IfModule>

# Set caching headers
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  
  # CSS, JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  
  # Others
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType application/x-font-woff "access plus 1 year"
</IfModule>

# SPA routing - redirect all requests to index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;
  
  fs.writeFileSync(htaccessPath, content);
  console.log('✅ .htaccess created');
}

/**
 * Create a _redirects file for Netlify
 */
function createNetlifyRedirects() {
  console.log('🔀 Creating Netlify _redirects...');
  
  const redirectsPath = path.join(distDir, '_redirects');
  
  const content = `# Netlify redirects file
# SPA routing - redirect all requests to index.html
/*    /index.html   200
`;
  
  fs.writeFileSync(redirectsPath, content);
  console.log('✅ Netlify _redirects created');
}

/**
 * Create a vercel.json file for Vercel
 */
function createVercelConfig() {
  console.log('⚡ Creating Vercel config...');
  
  const vercelPath = path.join(distDir, 'vercel.json');
  
  const content = `{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).css",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}`;
  
  fs.writeFileSync(vercelPath, content);
  console.log('✅ vercel.json created');
}

// Run optimizations
createCacheManifest();
createRobotsTxt();
createHtaccess();
createNetlifyRedirects();
createVercelConfig();

console.log('✨ Post-build optimizations completed!');