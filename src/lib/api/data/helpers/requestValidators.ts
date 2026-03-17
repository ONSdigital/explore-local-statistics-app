export function isLargeSpreadsheetRequest(params: parsedParams) {
	return (
		['topic', 'indicator', 'geo', 'geoExtent', 'geoCluster', 'time', 'measure'].every(
			(key) => params[key] === 'all'
		) && params.format === 'xlsx'
	);
}
