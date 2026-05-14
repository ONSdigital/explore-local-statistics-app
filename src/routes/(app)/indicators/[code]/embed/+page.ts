import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { getParam } from '$lib/api/utils';
import { isValidChartType } from '$lib/util/validationHelpers';
import { geoLevels } from '$lib/config/geoLevels';

export const load: PageLoad = async ({ fetch, params, url }) => {
	const chartType = getParam(url, 'type', null);
	const geo = getParam(url, 'geo', null);
	const selected = getParam(url, 'areas', []);
	const timeRange = getParam(url, 'years', []);
	const hasIntervals = getParam(url, 'intervals', false);
	// const related = getParam(url, "related", null);
	// const relatedLabel = getParam(url, "related_label", null);

	if (!isValidChartType(chartType)) error(400, { message: 'Invalid chart type' });

	const geoLevel = geoLevels[geo] || null;
	const metaUrl = resolve(`/api/v1/metadata/indicators/${params.code}`);

	try {
		const indicator = await (await fetch(metaUrl)).json();

		return {
			indicator,
			chartType,
			hasIntervals,
			geoLevel: geoLevel ? { id: geo, ...geoLevel } : null,
			selected: [selected].flat(),
			timeRange: typeof timeRange === 'string' ? [timeRange, timeRange] : timeRange
		};
	} catch {
		error(404, { message: 'Selected data indicator not found.' });
	}
};
