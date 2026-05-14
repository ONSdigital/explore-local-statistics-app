export function isOversizedRequest(params: parsedParams) {
	if (params.format === 'csvw') return false;
	const largeTime = params.time === 'all' || [params.time].flat().length > 1;
	const largeInidcators =
		params.indicator === 'all' ||
		[params.indicator].flat().length > 20 ||
		[params.topic].flat().length > 1;
	const largeGeoGroups = new Set(['all', 'ltla', 'utla']);
	const largeGeo =
		params.geoExtent === 'all' &&
		params.geoCluster === 'all' &&
		[params.geo].flat().some((geo) => largeGeoGroups.has(geo));
	return largeTime && largeInidcators && largeGeo;
}
