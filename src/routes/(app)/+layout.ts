import type { LayoutLoad } from './$types';
import summaryStats from '$lib/data/json-stat-summary.json';

export const load: LayoutLoad = () => {
	return {
		summaryStats
	};
};
