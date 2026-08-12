import { makeDataUrl } from '$lib/utils';

export async function load({ url, fetch }) {
	const comparisonAreas = url.searchParams.get('areas')?.split(',').filter(Boolean) ?? [];
	const indicator = url.searchParams.get('indicator') ?? null;

	if (!comparisonAreas.length || !indicator) {
		return { comparisonAreas, indicator, data: null };
	}

	const dataUrl = makeDataUrl(indicator, [], 'latest', comparisonAreas);

	const response = await fetch(dataUrl);
	const data = await response.json();

	return { comparisonAreas, indicator, data };
}
