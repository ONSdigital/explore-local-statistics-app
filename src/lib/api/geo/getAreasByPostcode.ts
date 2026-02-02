import getAreasByLngLat from './getAreasByLngLat';

export async function getAreasByPostcode(params = {}) {
	const areas = await getAreasByLngLat({
		lng: params.postcode.lng,
		lat: params.postcode.lat,
		year: params.year,
		geoLevel: params.geoLevel,
		groupByLevel: params.groupByLevel
	});

	if (areas.error) return areas;

	areas.meta = { query: params.code, ...params.postcode, ...areas.meta };
	return areas;
}
