import type { LayoutLoad } from './$types';
import { base } from '$app/paths';

export const load: LayoutLoad = async ({ fetch }) => {
	const coreMetadata = await (await fetch(`${base}/insights/core-metadata.json`)).json();

	return {
		title: `Explore local statistics - ONS`,
		description: `Explore local statistics from the ONS about people and the communities they live in. Includes topics such as population, economy and health.`,
		coreMetadata
	};
};
