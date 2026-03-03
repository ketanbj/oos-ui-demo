import fs from 'node:fs/promises';

const SOURCE_URL = 'https://www.google.com/maps/d/kml?mid=1805q6rlePY4WZd8QMOaNe2BqAgFkYBY&forcekml=1';
const OUTPUT_PATH = 'public/data/starlink-ground-stations.json';

function parsePlacemarkBlocks(kmlText) {
  return Array.from(kmlText.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/g), (m) => m[1]);
}

function unwrapCdata(value) {
  if (!value) {
    return '';
  }
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function parsePlacemark(placemark) {
  if (!/<Point>/.test(placemark) || !/Data name="Ka Operational"/.test(placemark)) {
    return null;
  }

  const nameMatch = placemark.match(/<name>([\s\S]*?)<\/name>/);
  const coordMatch = placemark.match(/<coordinates>\s*([-0-9.]+),([-0-9.]+),/m);
  const statusMatch = placemark.match(
    /<Data name="Status">\s*<value>([\s\S]*?)<\/value>/
  );
  const antennaCountMatch = placemark.match(
    /<Data name="Ka Antenna Count">\s*<value>([^<]*)<\/value>/
  );

  if (!nameMatch || !coordMatch) {
    return null;
  }

  const name = unwrapCdata(nameMatch[1]);
  const lon = Number(coordMatch[1]);
  const lat = Number(coordMatch[2]);
  const status = unwrapCdata(statusMatch?.[1] ?? 'Unknown');
  const antennaCount = Number(antennaCountMatch?.[1] ?? '0');

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return {
    name,
    lat,
    lon,
    status,
    antennaCount: Number.isFinite(antennaCount) ? antennaCount : 0
  };
}

function isOperationalLike(status) {
  const positive = /(live|built|reported live|presumed live)/i.test(status);
  const negative = /(not built|construction|pending|planned|license|filed|cancel|deconstruct|demolish|tt&c|not active)/i.test(status);
  return positive && !negative;
}

function selectEvenlyByLongitude(stations, limit) {
  const sorted = [...stations].sort((a, b) => a.lon - b.lon);
  if (sorted.length <= limit) {
    return sorted;
  }

  const selected = [];
  const step = sorted.length / limit;
  for (let i = 0; i < limit; i += 1) {
    selected.push(sorted[Math.floor(i * step)]);
  }
  return selected;
}

function pickMirroredSites(stations) {
  const targets = [-120, 0, 120];
  const chosen = [];
  const usedNames = new Set();

  targets.forEach((targetLon) => {
    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;

    stations.forEach((station) => {
      if (usedNames.has(station.name)) {
        return;
      }

      const longitudeDistance = Math.abs(station.lon - targetLon);
      const antennaBonus = Math.max(0, 40 - station.antennaCount) * 0.08;
      const score = longitudeDistance + antennaBonus;

      if (score < bestScore) {
        bestScore = score;
        best = station;
      }
    });

    if (best) {
      usedNames.add(best.name);
      chosen.push(best);
    }
  });

  if (chosen.length < 3) {
    const fallback = stations
      .filter((station) => !usedNames.has(station.name))
      .sort((a, b) => b.antennaCount - a.antennaCount)
      .slice(0, 3 - chosen.length);
    chosen.push(...fallback);
  }

  return chosen;
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ground stations KML: ${response.status}`);
  }

  const kmlText = await response.text();
  const placemarks = parsePlacemarkBlocks(kmlText);
  const allStations = placemarks.map(parsePlacemark).filter(Boolean);
  const operationalStations = allStations.filter((station) => isOperationalLike(station.status));

  const displayStations = selectEvenlyByLongitude(operationalStations, 160);
  const mirroredSites = pickMirroredSites(operationalStations);

  const output = {
    source: 'Unofficial Starlink Global Gateways & PoPs (Google My Maps)',
    source_url: SOURCE_URL,
    generated_at: new Date().toISOString(),
    counts: {
      total_gateway_points: allStations.length,
      operational_like_points: operationalStations.length,
      display_points: displayStations.length
    },
    mirrored_sites: mirroredSites,
    stations: displayStations
  };

  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Gateway points: ${allStations.length}`);
  console.log(`Operational-like points: ${operationalStations.length}`);
  console.log(`Display points: ${displayStations.length}`);
  console.log(`Mirrored sites: ${mirroredSites.map((site) => site.name).join(' | ')}`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
