import { assets, base } from '$app/paths';

type GetDataResult = { kind: 'Success'; chartData: JSON; metadata: JSON } | { kind: 'Failure' };

function fastReshapeIndicatorData(colData) {
	// On James's MacBook, this takes around 6 ms for all datasets, whereas using code
	// similar to `reshapeData` takes around 55 ms.
	return colData.value.map((d: number, i: number) => ({
		areacd: colData.areacd[i],
		id: colData.id, // id and code are the same for all objects, so they're not stored as arrays in the JSON file.
		value: d,
		lci: colData.lci[i],
		uci: colData.uci[i],
		xDomainNumb: colData.xDomainNumb[i]
	}));
}

function reshapeData(colData) {
	const cols = Object.keys(colData);
	const rowData = [];
	for (let i = 0; i < colData[cols[0]].length; i++) {
		const row: { [key: string]: string | number } = {};
		for (const col of cols) {
			row[col] = colData[col][i];
		}
		rowData.push(row);
	}
	return rowData;
}

export const getData = async (fetch: typeof window.fetch): Promise<GetDataResult> => {
	const dataResult = await fetch(`${assets}/insights/column-oriented-data.json`);
	const metadataResult = await fetch(`${assets}/insights/config.json`);

	if (dataResult && metadataResult) {
		const dataParsed = await dataResult.json();
		const metadataParsed = await metadataResult.json();

		const reshapedData = {};
		for (const code in dataParsed.combinedDataObjectColumnOriented) {
			reshapedData[code] = fastReshapeIndicatorData(
				dataParsed.combinedDataObjectColumnOriented[code]
			);
		}

		const clusterData = reshapeData(metadataParsed.clustersLookup.data);

		return {
			kind: 'Success',
			chartData: {
				combinedDataObject: reshapedData,
				beeswarmKeyData: dataParsed.beeswarmKeyData,
				clusterData
			},
			metadata: metadataParsed
		};
	} else {
		return { kind: 'Failure' };
	}
};
