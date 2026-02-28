const sharp = require('sharp');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const BRAND_COLOR = '#2563eb';

// Create SVG for the icon
function createSVG(size, padding = 0) {
  const actualSize = size - (padding * 2);
  const fontSize = Math.round(actualSize * 0.65);
  const yPos = Math.round(size * 0.72);
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="white" rx="${Math.round(size * 0.15)}"/>
    <rect x="${padding}" y="${padding}" width="${actualSize}" height="${actualSize}" fill="${BRAND_COLOR}" rx="${Math.round(actualSize * 0.2)}"/>
    <text x="${size/2}" y="${yPos}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">P</text>
  </svg>`;
}

// Maskable icon SVG (full bleed with more padding for safe zone)
function createMaskableSVG(size) {
  const padding = Math.round(size * 0.1); // 10% padding for maskable safe zone
  const innerSize = size - (padding * 2);
  const fontSize = Math.round(innerSize * 0.55);
  const yPos = Math.round(size * 0.62);
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${BRAND_COLOR}"/>
    <text x="${size/2}" y="${yPos}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">P</text>
  </svg>`;
}

async function generateIcons() {
  // Regular icons
  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];
  
  for (const { name, size } of sizes) {
    const svg = Buffer.from(createSVG(size));
    await sharp(svg).png().toFile(path.join(ICONS_DIR, name));
    console.log(`Created ${name}`);
  }
  
  // Maskable icons
  const maskableSizes = [
    { name: 'icon-maskable-192.png', size: 192 },
    { name: 'icon-maskable-512.png', size: 512 },
  ];
  
  for (const { name, size } of maskableSizes) {
    const svg = Buffer.from(createMaskableSVG(size));
    await sharp(svg).png().toFile(path.join(ICONS_DIR, name));
    console.log(`Created ${name}`);
  }
  
  // Favicon (32x32)
  const faviconSvg = Buffer.from(createSVG(32));
  await sharp(faviconSvg).png().toFile(path.join(ICONS_DIR, '..', 'favicon.ico'));
  console.log('Created favicon.ico');
  
  console.log('All icons generated!');
}

generateIcons().catch(console.error);
