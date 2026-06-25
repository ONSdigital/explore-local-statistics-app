import type { PageLoad } from './$types';
import { resolve } from '$app/paths';
import { error, redirect } from '@sveltejs/kit';
import { pluralise } from '@onsvisual/robo-utils';
import { geoLevels } from '$lib/config/geoLevels';
import { countryLetterLookup } from '$lib/config/geoLookups';
import indicatorRedirects from '$lib/data/indicator_redirects.json';

function getInitialArea(indicator, areas: areaObject[], areacd: string) {
	if (!indicator.standardised) return null;
	const area =
		areas.find((d) => d.areacd === areacd) ||
		(indicator.geography.countries.length === 1
			? areas.find((d) => d.areacd === countryLetterLookup[indicator.geography.countries[0]])
			: areas.find((d) => d.areacd === 'K02000001')) ||
		areas.find((d) => d.areacd === 'K03000001');
	return area || null;
}

export const load: PageLoad = async ({ params, url, fetch }) => {
	const path = resolve(`/api/v1/metadata/indicators/${params.code}?fullDims=true`);
	const areasPath = resolve(`/api/v1/geo/list?indicator=${params.code}&year=all`);

	try {
		const [indicator, areas] = await Promise.all([
			(await fetch(path)).json(),
			(await fetch(areasPath)).json()
		]);
		// this sorts areas by name then code, then deduplicates taking the newer geography
		areas
			.sort((a, b) => a.areanm.localeCompare(b.areanm) || a.areacd.localeCompare(a.areacd))
			.filter(
				(d, i, arr) =>
					!(
						d.areanm === arr?.[i + 1]?.areanm &&
						d.areacd.slice(0, 3) === arr?.[i + 1]?.areacd?.slice?.(0, 3)
					)
			);
		const periods = Object.keys(indicator.dimensions.period.category.index);
		const gLevels = indicator.geography.levels
			.filter(
				(id: string) =>
					!(
						id === 'uk' ||
						(id === 'ctry' && indicator.geography.countries.length === 1) ||
						(['rgn', 'utla'].includes(id) && !indicator.geography.countries.includes('E'))
					)
			)
			.map((id: string) => {
				const geoLevel = geoLevels[id];
				return {
					id,
					...geoLevel,
					label: pluralise(geoLevel.label)
				};
			});

		const initialAreaCode = url.searchParams.get('initialArea') || null;
		const initialArea = getInitialArea(indicator, areas, initialAreaCode);

		return {
			indicator,
			areas,
			initialArea,
			geoLevels: gLevels,
			periods,

			// Page metadata
			title: `${indicator.label} - ONS`,
			description: indicator.subtitle,
			pageType: `indicators`,
			breadcrumbLinks: [
				{ label: 'Home', href: '/' },
				{ label: 'Explore local statistics', href: resolve('/') },
				{ label: 'Local indicators', href: resolve('/indicators') }
			],
			breadcrumbBackground: '#eaeaea'
		};
	} catch {
		if (indicatorRedirects[params.code])
			redirect(301, resolve(`/indicators/${indicatorRedirects[params.code]}`));
		else error(404, 'Selected data indicator not found.');
	}
};
