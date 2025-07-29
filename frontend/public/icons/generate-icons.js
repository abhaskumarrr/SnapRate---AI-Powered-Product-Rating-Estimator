// Simple script to generate PWA icons from SVG
// This creates a basic icon for the SnapRate app

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG icon
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb" rx="64"/>
  <g transform="translate(128, 128)">
    <!-- Camera icon -->
    <rect x="32" y="64" width="192" height="128" fill="white" rx="16" stroke="none"/>
    <circle cx="128" cy="128" r="32" fill="#2563eb"/>
    <rect x="96" y="48" width="64" height="16" fill="white" rx="8"/>
    
    <!-- Star rating -->
    <g transform="translate(16, 192)">
      <polygon points="24,8 28,20 40,20 30,28 34,40 24,32 14,40 18,28 8,20 20,20" fill="#fbbf24"/>
      <polygon points="64,8 68,20 80,20 70,28 74,40 64,32 54,40 58,28 48,20 60,20" fill="#fbbf24"/>
      <polygon points="104,8 108,20 120,20 110,28 114,40 104,32 94,40 98,28 88,20 100,20" fill="#fbbf24"/>
      <polygon points="144,8 148,20 160,20 150,28 154,40 144,32 134,40 138,28 128,20 140,20" fill="#fbbf24"/>
      <polygon points="184,8 188,20 200,20 190,28 194,40 184,32 174,40 178,28 168,20 180,20" fill="#d1d5db"/>
    </g>
  </g>
</svg>
`;

// Write the SVG file
fs.writeFileSync(path.join(__dirname, 'icon.svg'), svgIcon);

console.log('SVG icon created. Use an online converter or image editing tool to create PNG versions in the following sizes:');
console.log('72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512');