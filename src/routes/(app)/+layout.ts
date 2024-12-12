import type { LayoutLoad } from './$types';
import coreMetadata from '../../data/insights/core-metadata.json';

export const load: LayoutLoad = async () => {
	return {
		coreMetadata,
		title: `Explore local statistics - ONS`,
		description: `Find, compare and visualise statistics about communities in the United Kingdom. Includes data on population, economy and health.`,
		pageType: `home page`
	};
};
