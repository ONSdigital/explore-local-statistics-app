import { base } from '$app/paths';

type GetDataResult = { kind: 'Success'; chartData: JSON; metadata: JSON } | { kind: 'Failure' };

export const getData = async (fetch: typeof window.fetch): Promise<GetDataResult> => {
	const dataResult = await fetch(`${base}/insights/column-oriented-data.json`);
	const metadataResult = await fetch(`${base}/insights/config.json`);

	if (dataResult && metadataResult) {
		const dataParsed = await dataResult.json();
		const metadataParsed = await metadataResult.json();

		const reshapedData = {};
		for (const code in dataParsed.combinedDataObjectColumnOriented) {
			const colData = dataParsed.combinedDataObjectColumnOriented[code];
			const cols = Object.keys(colData).filter((d) => d !== 'id' && d !== 'code');
			const chartData = [];
			for (let i = 0; i < colData.value.length; i++) {
				const row: { [key: string]: string | number } = {};
				// id and code are the same for all objects, so they're not stored as arrays in the JSON file.
				row.id = colData.id;
				for (const col of cols) {
					row[col] = colData[col][i];
				}
				chartData.push(row);
			}
			reshapedData[code] = chartData;
		}

		return {
			kind: 'Success',
			chartData: { combinedDataObject: reshapedData, beeswarmKeyData: dataParsed.beeswarmKeyData },
			metadata: metadataParsed
		};
	} else {
		return { kind: 'Failure' };
	}
};
