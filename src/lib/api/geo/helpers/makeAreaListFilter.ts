import readData from '$lib/data';
import { geoYearFilter, makeGeoFilter } from './geoFilters';

const metadata = await readData('json-stat-metadata');

export function makeGeoDatasetFilter(slug) {
	const ds = metadata.link.item.find((ds) => ds.extension.slug === slug);
	return ds ? (d) => ds.dimension.areacd.category.index[d.areacd] : () => false;
}

export default function makeAreaListFilter(geo, year, indicator) {
	if (geo === 'all' && year === 'all' && indicator === 'all') return null;
	const yFilter = year === 'all' ? () => true : geoYearFilter;
	const gFilter = geo === 'all' ? () => true : makeGeoFilter([geo].flat());
	const iFilter = indicator === 'all' ? () => true : makeGeoDatasetFilter(indicator);
	return (d) => yFilter(d, year) && gFilter(d) && iFilter(d);
}
