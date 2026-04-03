import { readFileSync, writeFileSync } from 'fs';
import * as topojson from 'topojson-client';

const inputPath = process.argv[2] || 'public/geojson/oil-blocks-nosdra.topojson';
const outputPath = process.argv[3] || 'public/geojson/oil-blocks.geojson';

const topo = JSON.parse(readFileSync(inputPath, 'utf8'));

const objectKey = Object.keys(topo.objects)[0];
const geojson = topojson.feature(topo, topo.objects[objectKey]);

// Remap properties to match what our app expects
geojson.features = geojson.features.map((f, i) => {
  const p = f.properties || {};
  const blockName = p.BLOCK_NAME || '';
  const isOML = blockName.startsWith('OML');
  const isOPL = blockName.startsWith('OPL');
  return {
    type: 'Feature',
    id: i,
    geometry: f.geometry,
    properties: {
      name: blockName,
      type: isOML ? 'OML' : isOPL ? 'OPL' : 'Block',
      status: (p.STATUS || '').toLowerCase().includes('production') ? 'active' :
              (p.TYPE || '').toLowerCase() === 'offered' ? 'offered' : 'exploration',
      operator: p.OPERATOR || '',
      terrain: p.TERRAIN || '',
      basin: p.BASIN || '',
      area_sqkm: p.TOTAL_SQKM || '',
      award_date: p.AWARD_DATE || '',
      contract: p.CONTRACT || '',
      rights: p.RIGHTS || '',
    },
  };
});

writeFileSync(outputPath, JSON.stringify(geojson));
console.log(`Converted ${geojson.features.length} features to ${outputPath}`);

// Validate a few coordinates
const sample = geojson.features[0];
const coords = sample.geometry.coordinates[0][0];
console.log(`Sample block: ${sample.properties.name}`);
console.log(`First coordinate: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`);
