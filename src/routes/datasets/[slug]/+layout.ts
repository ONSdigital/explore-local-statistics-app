/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import type { LayoutLoad } from './$types';
import { base } from '$app/paths';
import { inferGeos } from '$lib/util/geo/inferGeos';

export const load: LayoutLoad = async ({ fetch, parent, params }) => {
	const { config } = await parent();
	const indicator = config.indicatorsObject[params?.slug];

	if (!indicator) {
		error(404, { message: 'Invalid dataset requested' });
	} else {
		const allData = await (await fetch(`${base}/insights/data.json`)).json();
		const data = allData.combinedDataObject[indicator.code];
		const codes = [];
		const years = [];
		for (const d of data) {
			d.areanm = config.areasObject[d.areacd]?.areanm || 'Unknown area';
			if (!codes.includes(d.areacd)) codes.push(d.areacd);
			if (!years.includes(d.xDomainNumb)) years.push(d.xDomainNumb);
		}
		const geos = inferGeos(codes);

		return {
			title: `${indicator.metadata.label} - ONS`,
			description: `${indicator.metadata.subtitle}.`,
			config,
			indicator,
			data,
			geos,
			years: years.sort((a, b) => a - b)
		};
	}
};
