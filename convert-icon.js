const fs = require('fs');
const { execSync } = require('child_process');

// Check if we have the required tools
try {
  execSync('which convert', { stdio: 'ignore' });
  console.log('ImageMagick found, converting SVG to PNG formats...');
  
  // Convert to different sizes
  execSync('convert icon.svg -resize 512x512 icon.png');
  execSync('convert icon.svg -resize 192x192 icon-192.png');
  execSync('convert icon.svg -resize 32x32 favicon.ico');
  execSync('convert icon.svg -resize 180x180 apple-touch-icon.png');
  
  console.log('Icon conversion completed!');
  console.log('Generated files:');
  console.log('- icon.png (512x512)');
  console.log('- icon-192.png (192x192)');
  console.log('- favicon.ico (32x32)');
  console.log('- apple-touch-icon.png (180x180)');
  
} catch (error) {
  console.log('ImageMagick not found. Please install it first:');
  console.log('On macOS: brew install imagemagick');
  console.log('On Ubuntu/Debian: sudo apt-get install imagemagick');
  console.log('On Windows: Download from https://imagemagick.org/script/download.php#windows');
  console.log('');
  console.log('Alternatively, you can use an online SVG to PNG converter with the icon.svg file.');
}
