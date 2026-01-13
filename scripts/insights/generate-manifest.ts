import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const dir = 'scripts/insights/raw/family-ess-main/';
const csvs = readdirSync(dir, { recursive: true })
	.filter((f) => f.endsWith('.csv'))
	.filter((f) => !f.includes('uk-small-area-gross-value-added-estimates'));

// filePath:
const paths = csvs.map((f) => join(dir, f));

// Define multi-indicator datasets
let multi = [
	'personal-wellbeing-estimates',
	'average-travel-time',
	'employment-rate-ni',
	'healthy-life-expectancy',
	'foreign-direct-investment',
	'employment-rate',
	'early-years',
	'child-weight',
	'business-demography',
	'apprenticeships',
	'apprenticeships-scotland',
	'gdp-per-head',
	'engagement-with-culture-and-heritage',
	'population-indicators'
];

console.log(
	'There are',
	csvs.length,
	'data files, of which',
	multi.length,
	'are multi-indicator files'
);

// Define datasets to exclude
const toExclude = []; // currently none!

// multiIndicatorCategory:
const m = multi.map((m) => m + '/' + m + '.csv');
const mind = csvs.map((f) => (m.includes(f) ? 'indicator' : ''));

// include:
const exc = toExclude.map((e) => e + '/' + e + '.csv');
const include = csvs.map((f) => (exc.includes(f) ? 'N' : 'Y'));

// valueField - don't need this any more

// Make csvs with columns: filePath, include, multiIndicatorCategory
const output = {
	filePath: paths,
	include: include,
	multiIndicatorCategory: mind
};
const colNames = Object.keys(output);

const rows = [];
for (let i = 0; i < csvs.length; i++) {
	const r = colNames.map((n) => output[n][i]);
	rows.push(r);
}

const outputCsv = colNames.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
const outPath = './scripts/insights/raw/config-data/data-files-manifest.csv';

writeFileSync(outPath, outputCsv);
console.log(`Wrote ${outPath}`);
