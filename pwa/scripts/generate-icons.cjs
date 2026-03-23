const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create a simple SVG with the FICC logo
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#FF6B35" rx="${size * 0.125}"/>
  <text x="${size/2}" y="${size * 0.65}" font-size="${size * 0.5}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">F</text>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(__dirname, '../public');

  const sizes = [192, 512];

  for (const size of sizes) {
    const svg = createSvg(size);
    const outputPath = path.join(publicDir, `icon-${size}.png`);

    try {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
      console.log(`Generated: icon-${size}.png`);
    } catch (error) {
      console.error(`Failed to generate icon-${size}.png:`, error.message);
      process.exit(1);
    }
  }

  console.log('All icons generated successfully!');
}

generateIcons();
