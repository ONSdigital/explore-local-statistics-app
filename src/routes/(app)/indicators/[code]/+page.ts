import type { PageLoad } from './$types';
import { resolve } from '$app/paths';
import { error, redirect } from '@sveltejs/kit';
import { pluralise } from '@onsvisual/robo-utils';
import { geoLevels } from '$lib/config/geoLevels';
import { countryLetterLookup } from '$lib/config/geoLookups';
import indicatorRedirects from '$lib/data/indicator_redirects.json';

function getInitialArea(indicator, areas, areacd) {
	let area =
		areas.find((d) => d.areacd === areacd) ||
		(indicator.geography.countries.length === 1
			? areas.find((d) => d.areacd === countryLetterLookup[indicator.geography.countries[0]])
			: areas.find((d) => d.areacd === 'K02000001')) ||
		areas.find((d) => d.areacd === 'K03000001');
	return area || null;
}

export const load: PageLoad = async ({ params, url, fetch }) => {
	const path = resolve(`/api/v1/metadata/indicators/${params.code}?fullDims=true`);
	const periodPath = resolve(`/api/v1/metadata/indicators/${params.code}/dimensions/period`);
	const areasPath = resolve(`/api/v1/geo/list?indicator=${params.code}&year=all`);

	try {
		const [indicator, periodsRaw, areas] = await Promise.all([
			(await fetch(path)).json(),
			(await fetch(periodPath)).json(),
			(await fetch(areasPath)).json()
		]);
		areas.sort((a, b) => a.areanm.localeCompare(b.areanm));
		const periods = Object.keys(periodsRaw.category.index);
		const gLevels = indicator.geography.levels
			.filter((id) => id !== 'uk')
			.map((id) => {
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
			pageType: `indicator data page`,
			breadcrumbLinks: [
				{ label: 'Home', href: resolve('/') },
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
