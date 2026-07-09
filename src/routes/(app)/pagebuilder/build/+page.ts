import type { PageLoad } from './$types';
import { resolve } from '$app/paths';

export const load: PageLoad = async ({ fetch }) => {
	const primaryPath = resolve(
		'/api/v1/data.cols.json?indicator=median-age,net-additions-housing-stock,claimant-count&geo=E06000001,E06000002,E06000003&time=all'
	);
	const comparisonPath = resolve(
		'/api/v1/data.cols.json?indicator=median-age,net-additions-housing-stock,claimant-count&geo=E92000001,E92000004&time=all'
	);
	const primaryData = await (await fetch(primaryPath)).json();
	const comparisonData = await (await fetch(comparisonPath)).json();

	return {
		primaryData,
		comparisonData
	};
};
