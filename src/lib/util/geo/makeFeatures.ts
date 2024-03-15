/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { makeGeoJSON } from './makeGeoJSON';
import { groups } from './inferGeos';
import { oldGeoCodesLookup } from '$lib/config/geoConfig';

export async function makeFeatures(url, fetch = window.fetch) {
	const features = {};
	const topo = await (await fetch(url)).json();

	for (const grp of groups) {
		const geo = makeGeoJSON(topo, topo.objects[grp.key]);
		for (const f of geo.features) {
			features[f.properties.areacd] = f;
		}
	}
	for (const code of Object.keys(oldGeoCodesLookup))
		features[code] = features[oldGeoCodesLookup[code]];

	return features;
}
