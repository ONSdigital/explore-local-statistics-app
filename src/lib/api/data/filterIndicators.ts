import { makeDatasetGeoFilter } from '$lib/api/metadata/helpers/datasetFilters';

// Takes a JSON-Stat collection and returns an array of JSON-Stat datasets that meet the filter criteria
export default function filterIndicators(datasets, params) {
	const indicators = new Set([params.indicator].flat());
	const topics = [params.topic].flat();

	// Filter datasets by indicator, and by topic OR sub-topic (additive)
	const topicFilter =
		params.topic === 'all'
			? () => true
			: (d) => topics.some((t) => [d.extension.topic, d.extension.subTopic].includes(t));
	const indicatorFilter =
		params.indicator === 'all' ? () => true : (d) => indicators.has(d.extension.slug);
	const combinedFilter = ![params.topic, params.indicator].includes('all')
		? (d) => topicFilter(d) || indicatorFilter(d)
		: (d) => topicFilter(d) && indicatorFilter(d);
	datasets = datasets.filter(combinedFilter);

	// Remove multi-variate indicators if they have not been selected explicitly
	if (params.excludeMultivariate === true) {
		datasets = datasets.filter(
			(d) => !(d.extension.isMultivariate && !indicators.has(d.extension.slug))
		);
	}

	// Filter for datasets that include a specific geography
	if (params.hasGeo !== 'any') {
		const geoFilter = makeDatasetGeoFilter(params.hasGeo);
		if (geoFilter.error) return geoFilter;
		datasets = datasets.filter(geoFilter);
	}

	return datasets;
}
