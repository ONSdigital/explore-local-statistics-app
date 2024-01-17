import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	return {
		title: `Explore local statistics - ONS`,
		description: `Explore local statistics from the ONS about people and the communities they live in. Includes topics such as population, economy and health.`
	};
};
