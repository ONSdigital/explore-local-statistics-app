import { base } from '$app/paths';

type GetDatasetResult =
	| {
			kind: 'Success';
			chartData: { [key: string]: string | number }[];
			metadata: JSON;
			indicator: JSON;
	  }
	| { kind: 'Failure' };

export const getDataset = async (
	fetch: typeof window.fetch,
	slug: string
): Promise<GetDatasetResult> => {
	const metadataResult = await fetch(`${base}/insights/config.json`);
	if (!metadataResult) return { kind: 'Failure' };

	const metadata = await metadataResult.json();
	const indicator = Object.values(metadata.indicatorsObject).find(
		(ind) => ind.metadata.slug === slug
	);
	if (!indicator) return { kind: 'Failure' };

	const dataResult = await fetch(`${base}/insights/individual-datasets/${slug}.json`);

	if (dataResult) {
		const colData = await dataResult.json();
		const cols = Object.keys(colData).filter((d) => d !== 'id' && d !== 'code');
		const chartData = [];
		for (let i = 0; i < colData.value.length; i++) {
			const row: { [key: string]: string | number } = {};
			// id and code are the same for all objects, so they're not stored as arrays in the JSON file.
			row.id = colData.id;
			for (const col of cols) {
				row[col] = colData[col][i];
			}
			row.areanm = metadata.areasObject[row.areacd]?.areanm || 'Unnamed area';
			chartData.push(row);
		}

		return {
			kind: 'Success',
			chartData: filterExtremeAreas(chartData),
			metadata,
			indicator
		};
	} else {
		return { kind: 'Failure' };
	}
};

/**
 * Filters out areas that have values exceeding 700 times the minimum value for any year
 * @param {Array} data - Array of objects containing area data
 * @param {number} threshold - Multiplier threshold (default: 700)
 * @returns {Array} Filtered array excluding areas with extreme values
 */
function filterExtremeAreas(data, threshold = 700) {
	// Input validation
	if (!Array.isArray(data) || data.length === 0) {
		return [];
	}

	// Group values by year
	const yearGroups = data.reduce((acc, item) => {
		if (!acc[item.xDomainNumb]) {
			acc[item.xDomainNumb] = [];
		}
		acc[item.xDomainNumb].push(item.value);
		return acc;
	}, {});

	// Find minimum values per year
	const yearMinimums = Object.entries(yearGroups).reduce((acc, [year, values]) => {
		acc[year] = Math.min(...values);
		return acc;
	}, {});

	// Identify areas that exceed the threshold in any year
	const extremeAreas = new Set();
	data.forEach((item) => {
		const yearMin = yearMinimums[item.xDomainNumb];
		if (item.value > yearMin * threshold) {
			extremeAreas.add(item.areacd);
		}
	});

	// Filter out areas with extreme values
	return data.filter((item) => !extremeAreas.has(item.areacd));
}
