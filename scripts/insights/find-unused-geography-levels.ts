/**
 * A little script to find geography levels that are in the data but that we aren't using.
 */

import { loadCsvWithoutBom, readJsonSync } from './io.ts';
import CONFIG from './config.ts';

await main();

async function main() {
	const nodeVersion = process.version
		.slice(1)
		.split('.')
		.map((d) => +d);
	if (nodeVersion[0] < 20 || (nodeVersion[0] === 20 && nodeVersion[1] < 1)) {
		throw new Error('A more recent node version is needed for recursive directory readdir.');
	}

	const previous_file_paths = loadCsvWithoutBom(CONFIG.FILE_NAMES_LOG);
	const excludedIndicators = readJsonSync(CONFIG.EXCLUDED_INDICATORS_PATH);

	const file_paths = previous_file_paths.filter((f) => f.include === 'Y');

	const newGeogLevels = {};

	const areasGeogLevel = loadCsvWithoutBom(CONFIG.AREAS_GEOG_LEVEL_FILENAME);

	for (const f of file_paths.objects()) {
		const code = f.filePath.replace(/^.*[/]/, '').replace(/.csv$/, '');

		if (!excludedIndicators.includes(code)) {
			processFile(f, newGeogLevels, areasGeogLevel);
		}
	}

	Object.values(newGeogLevels).forEach((d) => {
		d.datasets = [...d.datasets];
		d.areacds = [...d.areacds];
	});

	console.log(JSON.stringify(newGeogLevels, null, '\t'));
}

function processFile(f, newGeogLevels, areasGeogLevel) {
	let indicator_data = loadCsvWithoutBom(f.filePath);

	indicator_data = indicator_data.rename(
		Object.fromEntries(indicator_data.columnNames().map((n) => [n, n.toLowerCase()]))
	);

	const levels = new Set(areasGeogLevel.objects().map((d) => d.areacd_prefix));
	for (const item of indicator_data) {
		if (!levels.has(item.areacd.slice(0, 3))) {
			newGeogLevels[item.geography] ||= { datasets: new Set(), areacds: new Set() };
			newGeogLevels[item.geography].datasets.add(
				f.filePath.split('/').slice(-1)[0].replace('.csv', '')
			);
			newGeogLevels[item.geography].areacds.add(item.areacd);
		}
	}
}
