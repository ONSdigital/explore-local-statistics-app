export const filterGeoGroups = (geos) => {
	let groups = [...geos.groups];
	if (!geos.ctrys.includes('E')) groups = groups.filter((g) => !['rgn', 'ltla'].includes(g.key));
	if (geos.ctrys.length < 2) groups = groups.filter((g) => g.key !== 'ctry');
	return groups;
};
