import summaryStats from '$lib/data/json-stat-summary.json';
import readData from '$lib/data';
import { geoYearFilter, makeGeoFilter } from './geoFilters';

const metadata = await readData('json-stat-metadata');

export function makeGeoDatasetFilter(ds) {
	return ds ? (d) => d.areacd in ds.dimension.areacd.category.index : () => false;
}

export function getLatestYear(ds) {
	return ds ? ds.extension.geography.year : summaryStats.geoYears[summaryStats.geoYears.length - 1];
}

export default function makeAreaListFilter(geo, year, indicator) {
	if (geo === 'all' && year === 'all' && indicator === 'all') return null;
	const ds =
		indicator !== 'all' ? metadata.link.item.find((ds) => ds.extension.slug === indicator) : null;
	const yr = year === 'latest' ? getLatestYear(ds) : year;
	const yFilter = year === 'all' ? () => true : geoYearFilter;
	const gFilter = geo === 'all' ? () => true : makeGeoFilter([geo].flat());
	const iFilter = indicator === 'all' ? () => true : makeGeoDatasetFilter(ds);
	return (d) => yFilter(d, yr) && gFilter(d) && iFilter(d);
}
