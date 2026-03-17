export function isLargeSpreadsheetRequest(params: parsedParams) {
	return (
		['topic', 'indicator', 'geo', 'geoExtent', 'geoCluster', 'time', 'measure'].every(
			(key) => params[key] === 'all'
		) && params.format === 'xlsx'
	);
}

export function isOversizedRequest(params: parsedParams) {
	if (params.format !== 'xlsx') return false;
	const largeTime = params.time === 'all' || [params.time].flat().length > 1;
	const largeInidcators =
		params.indicator === 'all' ||
		[params.indicator].flat().length > 20 ||
		[params.topic].flat().length > 1;
	const largeGeo =
		params.geoExtent === 'all' &&
		params.geoCluster === 'all' &&
		['all', 'ltla', 'utla'].some((geo) => geo === params.geo);
	return largeTime && largeInidcators && largeGeo;
}
