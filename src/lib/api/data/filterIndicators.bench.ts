// Benchmarks the dataset-level filter step in isolation from dimension filtering/
// formatting (see `getFilteredData.bench.ts` for the end-to-end pipeline).
//
// `filterIndicators` has a fast path (`topic: 'all'` + an explicitly-named `indicator`)
// that looks up each requested slug directly via a precomputed index instead of
// scanning/filtering the full dataset array (see `summaryStats.indicatorLookup`). It
// covers a single indicator (string) and a named list (array, e.g. IndicatorsCard.svelte's
// two-indicator request) alike - the fast path isn't limited to the single-indicator case.
// Any `hasGeo` value takes this same fast path too - it no longer requires `hasGeo: 'any'`
// specifically, since the geo check itself is cheap to run against just the already-found
// dataset(s) (`makeDatasetGeoFilter`) rather than being a reason to fall back to scanning
// every dataset. This compares that path against the ones that genuinely fall through to
// the O(n) `.filter()` path (`topic`-filtered or `indicator: 'all'` queries), so a change
// that accidentally narrows the fast path's conditions shows up as a regression here
// rather than only being noticed in aggregate end-to-end numbers.
import { bench, describe } from 'vitest';
import filterIndicators from './filterIndicators';
import summaryStats from '$lib/data/json-stat-summary.json';
import readData from '$lib/data';

// Same in-memory-cached reader `getFilteredData.ts` uses (see `src/lib/data/index.ts`) -
// reusing it here means the 11MB file is only ever parsed once per process, matching
// how the real server behaves rather than double-loading it via a separate import.
const cube = await readData('json-stat');
const datasets = cube.link.item;

const indicator = 'population-count';
const topic = summaryStats.topics[0].slug;

describe('filterIndicators', () => {
	bench('fast path: single indicator, topic=all, hasGeo=any', () => {
		filterIndicators(datasets, {
			topic: 'all',
			indicator,
			hasGeo: 'any',
			excludeMultivariate: false
		} as parsedParams);
	});

	bench('fast path: single indicator, topic=all, hasGeo set to a specific level', () => {
		filterIndicators(datasets, {
			topic: 'all',
			indicator,
			hasGeo: 'ltla',
			excludeMultivariate: false
		} as parsedParams);
	});

	bench('fast path: multiple named indicators (array), topic=all', () => {
		filterIndicators(datasets, {
			topic: 'all',
			indicator: ['population-count', 'median-age', 'employment-rate'],
			hasGeo: 'any',
			excludeMultivariate: false
		} as parsedParams);
	});

	bench('scan path: filtered by topic across all indicators', () => {
		filterIndicators(datasets, {
			topic,
			indicator: 'all',
			hasGeo: 'any',
			excludeMultivariate: false
		} as parsedParams);
	});

	bench('scan path: indicator=all (every dataset)', () => {
		filterIndicators(datasets, {
			topic: 'all',
			indicator: 'all',
			hasGeo: 'any',
			excludeMultivariate: false
		} as parsedParams);
	});
});
