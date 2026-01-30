import { readFileSync, writeFileSync } from 'fs';
import { csvParse } from 'd3-dsv';

const input = './scripts/config/slug_changes.csv';
const output = './src/lib/data/indicator_redirects.json';

const lookup: { [key: string]: string } = {};
const rows = csvParse(readFileSync(input, { encoding: 'utf8' }));

for (const row of rows) {
	if (row.slug_old !== row.slug_new) lookup[row.slug_old] = row.slug_new;
}

writeFileSync(output, JSON.stringify(lookup));
console.log(`Wrote lookup to ${output}`);
