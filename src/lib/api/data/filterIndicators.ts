import { makeDatasetGeoFilter } from '$lib/api/metadata/helpers/datasetFilters';
import summaryStats from '$lib/data/json-stat-summary.json';

// Takes a JSON-Stat collection and returns an array of JSON-Stat datasets that meet the filter criteria
export default function filterIndicators(datasets, params) {
	if (params.topic === 'all' && params.indicator !== 'all') {
		// Resolve one or more explicitly-named indicators via the precomputed slug->index
		// lookup instead of scanning the full dataset array. `excludeMultivariate` never
		// applies here since everything in this branch is named explicitly (see the
		// general path below for where that exclusion actually applies).
		const slugs = [params.indicator].flat();
		const seen = new Set();
		const found = [];
		for (const slug of slugs) {
			const index = summaryStats.indicatorLookup[slug];
			if (index >= 0 && !seen.has(index)) {
				seen.add(index);
				found.push(datasets[index]);
			}
		}
		if (params.hasGeo !== 'any') {
			const geoFilter = makeDatasetGeoFilter(params.hasGeo);
			if (geoFilter.error) return geoFilter;
			return found.filter(geoFilter);
		}
		return found;
	}
	const indicators = new Set([params.indicator].flat());
	const topics = new Set([params.topic].flat());

	// Filter datasets by indicator, and by topic OR sub-topic (additive)
	const topicFilter =
		params.topic === 'all'
			? () => true
			: (d) => topics.has(d.extension.topic) || topics.has(d.extension.subTopic);
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
