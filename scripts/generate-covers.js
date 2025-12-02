const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const coversDir = path.join(__dirname, "../public/reports/covers");
if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

const covers = [
  {
    symbol: "msft",
    name: "Microsoft",
    bgColor: { r: 20, g: 100, b: 150 },
    accentColor: { r: 50, g: 140, b: 200 },
  },
  {
    symbol: "nvda",
    name: "NVIDIA",
    bgColor: { r: 30, g: 30, b: 30 },
    accentColor: { r: 100, g: 180, b: 50 },
  },
  {
    symbol: "rtx",
    name: "RTX",
    bgColor: { r: 180, g: 60, b: 20 },
    accentColor: { r: 220, g: 120, b: 60 },
  },
  {
    symbol: "tsla",
    name: "Tesla",
    bgColor: { r: 30, g: 30, b: 30 },
    accentColor: { r: 180, g: 100, b: 200 },
  },
  {
    symbol: "nvax",
    name: "Novavax",
    bgColor: { r: 20, g: 120, b: 180 },
    accentColor: { r: 100, g: 180, b: 255 },
  },
  {
    symbol: "nflx",
    name: "Netflix",
    bgColor: { r: 180, g: 20, b: 20 },
    accentColor: { r: 50, g: 50, b: 50 },
  },
];

async function generateCovers() {
  for (const cover of covers) {
    const svg = `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${cover.symbol}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(${cover.bgColor.r},${cover.bgColor.g},${cover.bgColor.b});stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(${cover.accentColor.r},${cover.accentColor.g},${cover.accentColor.b});stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="900" fill="url(#grad${cover.symbol})" />
        <text x="600" y="450" font-size="72" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif">${cover.name}</text>
      </svg>`;

    const outputPath = path.join(coversDir, `${cover.symbol}.webp`);
    await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`✓ ${cover.symbol}.webp (${(stats.size / 1024).toFixed(1)} KB)`);
  }
  console.log("\nAll cover images generated successfully!");
}

generateCovers().catch(console.error);
