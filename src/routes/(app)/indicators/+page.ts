import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { coreMetadata } = await parent();

	return {
		coreMetadata,
		title: `Explore local indicators - ONS`,
		description: `Explore ${coreMetadata.indicatorsCodeLabelArray.length} local datasets from the ONS, including disposable household income, participation in further education and life satisfaction.`
	};
};
