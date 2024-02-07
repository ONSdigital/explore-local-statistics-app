/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { geoCodesLookup } from '$lib/config/geoConfig';
import { getName } from '@onsvisual/robo-utils';

const validYear = (place, year) =>
	!year || ((!place.start || year > place.start) && (!place.end || year <= place.end));

export function getParent(place, geocodes, year = null) {
	const parents = [...place.parents];
	if (['E', 'W'].includes(place.areacd[0]))
		parents.push({
			areacd: 'K04000001',
			areanm: 'England and Wales'
		});
	for (const parent of parents) {
		const typecd = parent.areacd.slice(0, 3);
		if (geocodes.includes(typecd) && validYear(parent, year)) {
			parent.groupcd = geoCodesLookup[typecd]?.key ? geoCodesLookup[typecd].key : 'ew';
			return parent;
		}
	}
	return null;
}

export function filterLinks(links, place) {
	const thislinks = [];
	const parentlinks = [];
	links.forEach((l) => {
		const parent = getParent(place, l.geocodes, l.year);
		if (l.geocodes.includes(place.typecd) && validYear(place, l.year)) {
			thislinks.push({ ...l, place });
		} else if (parent) {
			parentlinks.push({ ...l, place: getParent(place, l.geocodes, l.year) });
		}
	});
	return [...thislinks, ...parentlinks];
}

export function parseTemplate(template, place) {
	const getProp = (key) => {
		const val = place[key];
		if (key === 'groupcd' && val === 'ltla') return 'lad'; // Hack for LTLA issue on Census Maps links
		return val;
	};

	let output = template;
	const strs = template.match(new RegExp(/\{(.*?)\}/g));

	if (Array.isArray(strs)) {
		strs.forEach((s) => {
			if (s.includes('name')) {
				const context = s.slice(1, -1).split(',')[1];
				output = output.replace(
					s,
					`${getName(place, context, 'prefix')} <strong>${getName(place)}</strong>`
				);
			} else {
				output = output.replace(s, getProp(s.slice(1, -1)));
			}
		});
	}

	return output;
}
