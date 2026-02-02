import { feature } from 'topojson-client';
import { topology } from 'topojson-server';
import { coordEach } from '@turf/meta';
import { geoYearFilter, makeCountryFilter } from './helpers/geoFilters';
import { geoFormats } from '../config';
import { isValidGeoFormat } from '$lib/util/validationHelpers';
import readData from '$lib/data';
import summaryData from '$lib/data/json-stat-summary.json';

const topojson = await readData('topo');
const geoLatestYear = summaryData.geoYears[summaryData.geoYears.length - 1];

function roundCoords(coords) {
	coords[0] = Math.round(coords[0] * 1e4) / 1e4;
	coords[1] = Math.round(coords[1] * 1e4) / 1e4;
}

export default function getBoundaries(params = {}) {
	if (!isValidGeoFormat(params.format))
		return {
			error: 404,
			message: `Requested data format "${params.format}" not found. Only ${geoFormats.join(', ')} available.`
		};
	if (!topojson.objects[params.geoLevel])
		return {
			error: 400,
			message: `Geography level "${params.geoLevel}" not available.`
		};

	const geojson = feature(topojson, topojson.objects[params.geoLevel]);
	const countryFilter = params.country !== 'all' ? makeCountryFilter(params.country) : null;
	const featureFilter = countryFilter
		? (f) => countryFilter(f.properties.areacd) && geoYearFilter(f.properties, year)
		: (f) => geoYearFilter(f.properties, year);

	const year = params.year === 'latest' ? geoLatestYear : params.year;
	geojson.features = geojson.features.filter(featureFilter);
	if (params.format === 'geojson') coordEach(geojson, roundCoords);

	return params.format === 'topojson' ? topology({ [params.geoLevel]: geojson }, 1e5) : geojson;
}
