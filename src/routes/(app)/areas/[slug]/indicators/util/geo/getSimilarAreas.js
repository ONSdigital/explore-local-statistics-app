export function getSimilarAreas(areaClusters, clusterGroup, metadata, clusterData, parentArea) {
	if (!areaClusters?.[clusterGroup.id]) return { region: [], other: [] };
	const all = clusterData
		.filter(
			(d) => d[clusterGroup.id] === areaClusters[clusterGroup.id] && metadata.areasObject[d.areacd]
		)
		.map((d) => metadata.areasObject[d.areacd]);
	const region = [];
	const other = [];
	for (const d of all) {
		if (d.parentcd === parentArea.areacd) region.push(d);
		else other.push(d);
	}
	return { region, other };
}
