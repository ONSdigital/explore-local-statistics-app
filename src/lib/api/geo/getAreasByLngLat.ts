import { pointToTile } from '@mapbox/tilebelt';
import pointInPolygon from '@turf/boolean-point-in-polygon';
import { areaTilesBase } from '../config';
import { isValidLngLat } from '$lib/util/validationHelpers';
import groupAreasByLevel from './helpers/groupAreasByLevel';
import sortAreasByLevel from './helpers/sortAreasByLevel';
import { geoYearFilter, makeGeoLevelFilter } from './helpers/geoFilters';
import { geoLevelsAllLookup } from '$lib/config/geoLevels';
import summaryData from '$lib/data/json-stat-summary.json';

const geoLatestYear = summaryData.geoYears[summaryData.geoYears.length - 1];

function makeArea(props) {
	return { areacd: props.areacd, areanm: props.areanm };
}

export default async function getAreasByLngLat(params = {}) {
	if (!isValidLngLat(params.lng, params.lat))
		return { error: 400, message: 'Invalid lng/lat coordinates.' };

	const tile = pointToTile(params.lng, params.lat, 12);
	const point = { type: 'Point', coordinates: [params.lng, params.lat] };
	const url = `${areaTilesBase}/${tile[0]}/${tile[1]}.json`;

	const year =
		params.year === 'latest' ? geoLatestYear : params.year === 'all' ? null : params.year;
	const yearFilter = year ? (area) => geoYearFilter(area, year) : () => true;
	const geoFilter = params.geoLevel !== 'all' ? makeGeoLevelFilter(params.geoLevel) : () => true;

	try {
		const geojson = await (await fetch(url)).json();
		const features = geojson.features.filter(
			(f) => pointInPolygon(point, f) && yearFilter(f.properties) && geoFilter(f.properties.areacd)
		);
		const areas = features
			.map((f) => makeArea(f.properties))
			.filter((d) => geoLevelsAllLookup[d?.areacd?.slice(0, 3)]);

		// Add parent area name (small areas only) and area type name
		const ltla = areas.find((area) => geoLevelsAllLookup[area.areacd.slice(0, 3)].key === 'ltla');
		for (const area of areas) {
			const type = geoLevelsAllLookup[area.areacd.slice(0, 3)];
			area.type = type?.label;
			if (ltla && ['oa', 'lsoa', 'msoa', 'wd', 'par'].includes(type?.key))
				area.parent = ltla.areanm;
		}
		return {
			meta: {
				lng: params.lng,
				lat: params.lat,
				count: areas.length,
				total: areas.length
			},
			data: params.groupByLevel ? groupAreasByLevel(areas) : sortAreasByLevel(areas)
		};
	} catch {
		return { error: 400, message: 'No areas found. Requested coordinates out of range.' };
	}
}
