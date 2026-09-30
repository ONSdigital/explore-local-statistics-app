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
//   - These measure the whole pipeline (dataset filter + dimension filter + format),
//     not just formatting - a regression could come from any stage.
//   - Fixtures with `singleIndicator: true` represent the item route
//     (`/api/v1/data/{indicator}.{format}`); the rest represent the collection route
//     (`/api/v1/data.{format}`) - see `__fixtures__/queryShapes.ts`.
import { bench, describe } from 'vitest';
import getFilteredData from './getFilteredData';
import {
	chartTimeSeriesBroadGeo,
	chartLatestBroadGeo,
	singleValueSingleArea,
	multiIndicatorSingleArea,
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

	bench('multiple indicators, single area (cols.json)', async () => {
		await getFilteredData(multiIndicatorSingleArea);
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
