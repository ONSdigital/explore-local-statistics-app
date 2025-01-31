import { assets, base } from '$app/paths';

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
	const metadataResult = await fetch(`${assets}/insights/config.json`);
	if (!metadataResult) return { kind: 'Failure' };

	const metadata = await metadataResult.json();
	const indicator = Object.values(metadata.indicatorsObject).find(
		(ind) => ind.metadata.slug === slug
	);
	if (!indicator) return { kind: 'Failure' };

	const dataResult = await fetch(`${assets}/insights/individual-datasets/${slug}.json`);

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
			chartData,
			metadata,
			indicator
		};
	} else {
		return { kind: 'Failure' };
	}
};
