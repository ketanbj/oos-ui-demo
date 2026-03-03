import fs from 'node:fs/promises';

const SOURCE_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle';
const OUTPUT_PATH = 'public/data/starlink-shell1.tle';

function parseBlocks(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks = [];
  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];

    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      continue;
    }
    blocks.push({ name, line1, line2 });
  }
  return blocks;
}

function computeAltitudeKm(meanMotionRevPerDay) {
  const mu = 398600.4418; // km^3 / s^2
  const n = (meanMotionRevPerDay * 2 * Math.PI) / 86400;
  const a = Math.cbrt(mu / (n * n));
  return a - 6378.137;
}

function parseLine2(line2) {
  const inclinationDeg = Number(line2.slice(8, 16));
  const meanMotion = Number(line2.slice(52, 63));
  return { inclinationDeg, meanMotion };
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch TLEs: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const blocks = parseBlocks(text);

  // Starlink first shell approximation: inclination ~53 deg (with operational altitude spread).
  const shell1 = blocks.filter((block) => {
    const { inclinationDeg, meanMotion } = parseLine2(block.line2);
    if (!Number.isFinite(inclinationDeg) || !Number.isFinite(meanMotion)) {
      return false;
    }

    const altitudeKm = computeAltitudeKm(meanMotion);
    return inclinationDeg >= 52.9 && inclinationDeg <= 53.1 && altitudeKm >= 520 && altitudeKm <= 560;
  });

  const outLines = shell1.flatMap((block) => [block.name, block.line1, block.line2]);
  await fs.writeFile(OUTPUT_PATH, `${outLines.join('\n')}\n`, 'utf8');

  console.log(`Fetched ${blocks.length} Starlink TLEs`);
  console.log(`Filtered ${shell1.length} shell-1 candidates`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
