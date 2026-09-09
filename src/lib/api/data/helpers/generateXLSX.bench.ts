// Benchmarks spreadsheet generation in isolation from filtering, using a real "download
// data" request shape (see `__fixtures__/queryShapes.ts`).
//
// This exists as a baseline for the planned `@protobi/exceljs` -> `documonster`
// migration mentioned in `CLAUDE.md` - re-run `npm run test:bench -- generateXLSX`
// before and after that change against the same fixture to compare like-for-like,
// rather than by feel. `generateXLSX`'s exported signature (array of `{ data, meta }` in,
// `Buffer`/array-buffer-like out) is what stays stable across that swap; the benchmark
// only depends on that, not on ExcelJS internals.
import { bench, describe } from 'vitest';
import readData from '$lib/data';
import filterIndicators from '../filterIndicators';
import filterDatasets from '../filterDatasets';
import generateXLSX from './generateXLSX';
import { downloadAllDataXLSX } from '../__fixtures__/queryShapes';

// Filtering happens once, outside the benchmark loop, so only spreadsheet generation
// itself is timed.
const cube = await readData('json-stat');
const filteredIndicators = filterIndicators(cube.link.item, downloadAllDataXLSX);
const filtered = filterDatasets(filteredIndicators, downloadAllDataXLSX);

describe('generateXLSX', () => {
	bench('single indicator, all geo, all time', async () => {
		await generateXLSX(filtered);
	});
});
