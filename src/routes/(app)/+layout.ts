// @ts-nocheck
import type { LayoutLoad } from './$types';
import { resolve } from '$app/paths';
import summaryStats from '$lib/data/json-stat-summary.json';

export const load: LayoutLoad = () => {
	return {
		summaryStats
	};
};
