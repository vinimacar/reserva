const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const publicDir = path.resolve(__dirname, '../public');
  const svgPath = path.join(publicDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. Apple Touch Icon (180x180 PNG)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png (180x180)');

  // 2. Standard PWA 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png (192x192)');

  // 3. Standard PWA 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png (512x512)');

  // 4. Maskable PWA 512x512 with safe-zone margin (15% padding on all sides, full-bleed solid background)
  // Inner icon size = 512 * 0.75 = 384
  const innerSize = 384;
  const padding = Math.round((512 - innerSize) / 2);
  const innerBuffer = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  })
  .composite([
    {
      input: innerBuffer,
      top: padding,
      left: padding,
    }
  ])
  .png()
  .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png (512x512 with safe margin)');

  // 5. Favicon 48x48 PNG (browsers accept PNG icons or .ico)
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon-48x48.png'));
  console.log('Generated favicon-48x48.png');
}

generate().catch(err => {
  console.error('Error generating PWA icons:', err);
  process.exit(1);
});
