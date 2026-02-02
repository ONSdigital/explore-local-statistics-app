import { isValidPartialPostcode } from '$lib/util/validationHelpers';
import { postcodeLookupBase } from '../config';

function makePostcodeRow(json, i) {
	return { areacd: json.cd[i], type: 'postcode', lng: json.lng[i], lat: json.lat[i] };
}

export default async function getPostcodesList(params = {}) {
	const cdUpper = params?.code?.toUpperCase();
	if (!isValidPartialPostcode(cdUpper))
		return { error: 400, message: `${params.code} is not a valid partial postcode.` };

	const cdTrimmed = cdUpper.match(/[A-Z0-9]/g).join('');
	const url = `${postcodeLookupBase}/${cdTrimmed.slice(0, 4)}.json`;

	try {
		const json = await (await fetch(url)).json();

		const limit = params.limit || 10;
		const offset = params.offset || 0;
		const matches = [];

		for (let i = 0; i < json.cd.length; i++) {
			if (json.cd[i].replace(' ', '').slice(0, cdTrimmed.length) === cdTrimmed) {
				matches.push(makePostcodeRow(json, i));
			}
		}
		const postcodes = matches
			.toSorted((a, b) => {
				const aMatch = a.areacd.startsWith(cdUpper);
				const bMatch = b.areacd.startsWith(cdUpper);
				return aMatch && bMatch ? 0 : aMatch ? -1 : bMatch ? 1 : 0;
			})
			.slice(offset, offset + limit);

		return {
			meta: {
				query: params.code,
				count: postcodes.length,
				total: cdTrimmed.length > 3 ? matches.length : null,
				limit,
				offset
			},
			data: postcodes
		};
	} catch {
		return {
			error: 400,
			message: `No postcodes found for ${params.code}`
		};
	}
}
