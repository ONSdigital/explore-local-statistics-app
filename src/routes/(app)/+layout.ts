import type { LayoutLoad } from './$types';
import { base } from '$app/paths';

export const load: LayoutLoad = async ({ fetch }) => {
	const coreMetadata = await (await fetch(`${base}/insights/core-metadata.json`)).json();

	return {
		coreMetadata,
		title: `Explore local statistics - ONS`,
		description: `Find, compare and visualise statistics about communities in the United Kingdom. Includes data on population, economy and health.`
	};
};
