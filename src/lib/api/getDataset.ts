import { base } from '$app/paths';

type GetDatasetResult =
	| {
			kind: 'Success';
			chartData: { [key: string]: string | number }[];
			metadata: JSON;
			indicator: JSON;
	  }
	| { kind: 'Failure' };

const round = (num: number, dp = 0): number => {
	const p = Math.pow(10, dp);
	const n = num * p * (1 + Number.EPSILON);
	return Math.round(n) / p;
};

export const getDataset = async (
	fetch: typeof window.fetch,
	slug: string
): Promise<GetDatasetResult> => {
	const metadataResult = await fetch(`${base}/insights/config.json`);

	let metadata;
	let indicator;

	if (metadataResult) {
		metadata = await metadataResult.json();
		indicator = Object.values(metadata.indicatorsObject).find((ind) => ind.metadata.slug === slug);
		if (!indicator) return { kind: 'Failure' };
	}

	const dataResult = await fetch(`${base}/insights/column-oriented-data.json`);

	if (dataResult) {
		const allData = await dataResult.json();
		const colData = allData.combinedDataObjectColumnOriented[indicator.code];
		const cols = Object.keys(colData).filter((d) => d !== 'id' && d !== 'code');
		const chartData = [];
		for (let i = 0; i < colData.value.length; i++) {
			const row: { [key: string]: string | number } = {};
			// id and code are the same for all objects, so they're not stored as arrays in the JSON file.
			row.id = colData.id;
			for (const col of cols) {
				row[col] = colData[col][i];
			}
			row.value = round(row.value, +indicator.metadata.decimalPlaces);
			row.areanm = metadata.areasObject[row.areacd]?.areanm || 'Unnamed area';
			chartData.push(row);
		}

		return {
			kind: 'Success',
			chartData,
			metadata,
			indicator
		};
	} else {
		return { kind: 'Failure' };
	}
};
