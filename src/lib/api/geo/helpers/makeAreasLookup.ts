export default function makeAreasLookup(areas) {
	return Object.fromEntries(areas.map((a) => [a.areacd, a]));
}
