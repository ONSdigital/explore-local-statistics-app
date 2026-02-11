import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { csvParse } from 'd3-dsv';
import { reverseDate, stripBom, titleFromSlug, autoTypeWithoutDates } from './util/io';
import { DATA_DIR, skipDatasets, colLookup } from './util/config';
import inferGeos from './util/infer-geos';
import inferPeriodFormat from './util/infer-period-format';

function formatColumns(cols) {
	// Some CSVs currently use a "measure" column in place of "indicator"
	const hasInicatorCol = cols
		.map((col) => colLookup[col])
		.map((col) => col.type)
		.includes('indicator');

	return cols.map((col) => {
		let obj = { ...colLookup[col] };

		// For CSVs where the "measure" column is being used in place of "indicator"
		if (!hasInicatorCol && obj.name === 'measure') obj = { ...colLookup['indicator'] };

		obj.titles = col === obj.titles ? [col] : [col, obj.titles];
		if (!obj.name || obj.type === 'metadata') obj.suppressOutput = true;
		return obj;
	});
}

function isMultivariate(rows, cols) {
	const dimCols = cols.filter((col) => col.type === 'dimension');
	if (dimCols.length < 3) return false;

	// Check if more than one dimension column has multiple values
	const size = [];
	for (const col of dimCols) {
		const values = new Set(rows.map((row) => row[col.titles[0]]));
		size.push(values.size);
	}
	if (size.filter((n) => n > 1).length > 2) return true;
	return false;
}

function hasTimeseries(rows, cols) {
	const periodCol = cols.find((col) => col.name === 'period');
	const uniquePeriods = new Set(rows.map((row) => row[periodCol.titles[0]]));
	return uniquePeriods.size > 1;
}

function hasIntervals(rows, cols) {
	const intervalCol = cols.find((col) => col.name === 'lci_95');
	if (!intervalCol) return false;
	const uniqueValues = rows.map((row) => row[intervalCol.titles[0]]).filter((val) => val);
	return uniqueValues.length > 1;
}

async function makeBaseMetadata(meta, data, cols) {
	const shared = meta?.shared || meta;
	const sourceOrg = shared.sourceOrg.split('|');
	const sourceURL = shared.sourceURL.split('|');
	const sourceDate = shared.sourceDate.split('|').map((d) => reverseDate(d));
	const metadata = {
		source: sourceOrg.map((org, i) => ({
			name: org,
			href: sourceURL[i],
			date: sourceDate[i]
		})),
		experimentalStatistic: [true, 'T'].includes(shared.experimentalStatistic)
	};

	// Geography metadata is inferred from the GSS codes in the CSV
	const geoCol = cols.find((col) => col.name === 'areacd');
	const geoCodes = Array.from(new Set(data.map((d) => d[geoCol.titles[0]])));

	metadata.geography = await inferGeos(geoCodes);
	metadata.geography.initialLevel = metadata.geography.levels.slice(-1)[0];

	return metadata;
}

function makeIndicators(ds, meta, data, cols) {
	const indicators = [];
	const valueCol = cols.find((col) => col.name === 'value');
	const indicatorCol = cols.find((col) => col.type === 'indicator');
	const periodCol = cols.find((col) => col.name === 'period');
	const metaCols = cols.filter((col) => col.type === 'metadata');

	const isSingleIndicator = !meta.shared;
	const codes = !isSingleIndicator
		? Object.keys(meta).filter((k) => k !== 'shared')
		: [data[0][indicatorCol.titles[0]]];

	for (const code of codes) {
		const base = isSingleIndicator ? meta : { ...(meta.shared || {}), ...meta[code] };
		const rows = isSingleIndicator ? data : data.filter((d) => d[indicatorCol.titles[0]] === code);
		const indicator = {
			code,
			dataset: ds,
			label: base.label,
			prefix: base.prefix === 'GBPSign' ? '£' : base.prefix || null,
			suffix: base.suffix || null,
			subText: base.subText,
			decimalPlaces: base.decimalPlaces || 0,
			standardised: [true, 'T'].includes(base.standardised),
			subtitle: base.subtitle,
			longDescription: base.longDescription,
			caveats: base.caveats,
			// The below are calculated from the columns and values in the CSV
			isMultivariate: isMultivariate(rows, cols),
			hasTimeseries: hasTimeseries(rows, cols),
			confidenceIntervals: hasIntervals(rows, cols),
			canBeNegative: rows.map((d) => d[valueCol.titles[0]]).sort((a, b) => a - b)[0] < 0
		};

		// These seem to be the inverse of each other. Maybe can get rid of one?
		// (Current usage also seems to be inconsistent with the definition)
		indicator.zeroBaseline = !indicator.canBeNegative;

		// Periodicity and date format are inferred from the period strings in the CSV
		const periods = Array.from(
			new Set(
				rows.map((d) => {
					const period = d[periodCol.titles[0]];
					return period.toISOString ? period.toISOString().slice(0, 10) : period;
				})
			)
		);
		const { frequency, periodFormat } = inferPeriodFormat(periods);

		indicator.frequency = frequency;
		indicator.periodFormat = periodFormat;

		for (const col of metaCols) {
			indicator[col.name] = rows[0][col.titles[0]];
		}
		indicators.push(indicator);
	}
	return indicators;
}

async function makeMetadata(ds, meta, data, cols) {
	const metadata = await makeBaseMetadata(meta, data, cols);
	metadata.indicators = makeIndicators(ds, meta, data, cols);

	return metadata;
}

const datasets = readdirSync(DATA_DIR)
	.filter((item) => !item.includes('.') && !skipDatasets.includes(item))
	.filter(
		(item) =>
			existsSync(`${DATA_DIR}/${item}/${item}.csv`) &&
			existsSync(`${DATA_DIR}/${item}/${item}.json`)
	);

for (const ds of datasets) {
	const dataPath = `${DATA_DIR}/${ds}/${ds}.csv`;
	const metaPath = `${DATA_DIR}/${ds}/${ds}.json`;
	const csvwPath = `${DATA_DIR}/${ds}/${ds}.csv-metadata.json`;

	const data = csvParse(
		stripBom(readFileSync(dataPath, { encoding: 'utf-8' })),
		autoTypeWithoutDates
	);
	const meta = JSON.parse(readFileSync(metaPath, { encoding: 'utf-8' }));
	const modifedDate = execSync(`git log -1 --pretty="format:%cs" ${dataPath}`, {
		encoding: 'utf-8'
	});

	const columns = formatColumns(data.columns);
	const metadata = await makeMetadata(ds, meta['ess-beta-metadata'], data, columns);

	const csvw = {
		'@context': ['http://www.w3.org/ns/csvw', { '@language': 'en' }],
		url: `${ds}.csv`,
		'dc:title': meta.title || titleFromSlug(ds),
		'dc:creator': 'Office for National Statistics',
		'dc:publisher': metadata.source.map((s) => s.name).join(', '),
		// The most recent publication date of underlying data sources
		'dc:issued': metadata.source.map((s) => s.date).sort((a, b) => b.localeCompare(a))[0],
		// The date the CSV file was committed to git
		'dc:modified': modifedDate,
		'dc:license': 'http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
		tableSchema: {
			columns
		},
		metadata
	};

	writeFileSync(csvwPath, JSON.stringify(csvw, null, 2));
	console.log(`Wrote ${csvwPath}`);
}
