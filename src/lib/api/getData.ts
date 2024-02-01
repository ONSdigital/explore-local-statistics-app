import { base } from '$app/paths';

type GetDataResult = { kind: 'Success'; chartData: JSON; metadata: JSON } | { kind: 'Failure' };

export const getData = async (fetch: typeof window.fetch): Promise<GetDataResult> => {
	const dataResult = await fetch(`${base}/insights/data.json`);
	const metadataResult = await fetch(`${base}/insights/config.json`);

	if (dataResult && metadataResult) {
		const dataParsed = await dataResult.json();
		const metadataParsed = await metadataResult.json();

		return {
			kind: 'Success',
			chartData: dataParsed,
			metadata: metadataParsed
		};
	} else {
		return { kind: 'Failure' };
	}
};
