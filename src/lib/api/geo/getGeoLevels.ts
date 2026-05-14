import { geoLevelsArray } from '$lib/config/geoLevels';
import { geoYearFilter } from './helpers/geoFilters';
import readData from '$lib/data';

const geoMetadata = await readData('geo-metadata');
const geoArray = Object.values(geoMetadata);
const latestYear = Math.max(...geoArray.map((d) => d.start || 0));

export default function getGeoLevels(params = {}) {
	if (!params.includeAreas) return geoLevelsArray;

	const yFilter =
		params.year === 'all'
			? () => true
			: params.year === 'latest'
				? (d) => geoYearFilter(d, latestYear)
				: (d) => geoYearFilter(d, year);

	return geoLevelsArray.map((g) => {
		const obj = { ...g };
		const codes = new Set(obj.codes);
		obj.areas = geoArray
			.filter((d) => codes.has(d.areacd.slice(0, 3)) && yFilter(d))
			.map((d) => d.areacd);
		return obj;
	});
}
