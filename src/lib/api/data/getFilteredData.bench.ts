// Benchmarks for the full /api/v1/data.[format] request pipeline (this is what
// `+server.ts` calls). See `CLAUDE.md` "Performance notes for the data API" for the
// architecture this exercises, and `__fixtures__/queryShapes.ts` for what each shape
// represents in terms of real app usage.
//
// Run with `npm run test:bench` (or `npx vitest bench getFilteredData`).
//
// Notes for interpreting results:
//   - `cols.json` is the format actually used by every chart in the app - treat
//     regressions there as higher priority than the other formats.
//   - The `xlsx`/`csv` "download all data" benchmarks exist mainly as a baseline to
//     compare against after swapping the `@protobi/exceljs` dependency (see
//     `helpers/generateXLSX.ts`) - re-run these before/after that change.
//   - These measure the whole pipeline (dataset filter + dimension filter + format),
//     not just formatting - a regression could come from any stage.
import { bench, describe } from 'vitest';
import getFilteredData from './getFilteredData';
import {
	chartTimeSeriesBroadGeo,
	chartLatestBroadGeo,
	singleValueSingleArea,
	downloadAllDataXLSX,
	downloadAllDataCSV
} from './__fixtures__/queryShapes';

describe('getFilteredData - real usage shapes', () => {
	bench('chart: time series, broad geo group (cols.json)', async () => {
		await getFilteredData(chartTimeSeriesBroadGeo);
	});

	bench('chart: latest period, broad geo group (cols.json)', async () => {
		await getFilteredData(chartLatestBroadGeo);
	});

	bench('single value, single area (cols.json)', async () => {
		await getFilteredData(singleValueSingleArea);
	});

	bench('download: single indicator, all geo, all time (xlsx)', async () => {
		await getFilteredData(downloadAllDataXLSX);
	});

	bench('download: single indicator, all geo, all time (csv)', async () => {
		await getFilteredData(downloadAllDataCSV);
	});
});

describe('getFilteredData - format comparison (same query)', () => {
	// Same filter, different output formats - isolates per-format cost since the
	// filtering work above is identical for all of these.
	const base = chartTimeSeriesBroadGeo;

	bench('cols.json', async () => {
		await getFilteredData({ ...base, format: 'cols.json' });
	});
	bench('rows.json', async () => {
		await getFilteredData({ ...base, format: 'rows.json' });
	});
	bench('json (json-stat)', async () => {
		await getFilteredData({ ...base, format: 'json' });
	});
});
