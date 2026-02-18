import { geoLevels } from '$lib/config/geoLevels';
import { isValidAreaCode } from '$lib/util/validationHelpers';
import getChildAreas from '$lib/api/geo/getChildAreas';
import readData from '$lib/data';

const areasClusters = await readData('areas-clusters');

export default function makeGeoFilter(geo: string, geoExtent: string, geoCluster: string) {
	const codes = new Set();
	const types = new Set();
	for (const g of [geo].flat()) {
		if (geoLevels[g] && geoCluster === 'all') {
			if (isValidAreaCode(geoExtent)) {
				const children = getChildAreas({ code: geoExtent, geoLevel: g, includeNames: false });
				for (const child of children) codes.add(child);
			} else {
				for (const code of geoLevels[g].codes) types.add(code);
			}
		} else if (isValidAreaCode(g) && !types.has(g.slice(0, 3))) codes.add(g);
	}
	if (geoCluster) {
		const [grouping, cluster] = geoCluster.split('_');
		const cds = areasClusters.clusters?.[grouping]?.[cluster];
		if (Array.isArray(cds)) {
			for (const cd of cds) codes.add(cd);
		}
	}
	return codes.size > 0 && types.size > 0
		? (d) => codes.has(d[0]) || types.has(d[0].slice(0, 3))
		: types.size > 0
			? (d) => types.has(d[0].slice(0, 3))
			: codes.size > 0
				? (d) => codes.has(d[0])
				: () => false;
}
