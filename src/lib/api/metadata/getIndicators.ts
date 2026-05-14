import { makeDatasetFilter } from './helpers/datasetFilters';
import { formatDimension } from './helpers/formatMetadata';
import readData from '$lib/data';

const rawMetadata = await readData('json-stat-metadata');

function formatMetadata(ds, minimalMetadata = false, fullDims = false) {
	if (!ds) return {};
	if (minimalMetadata)
		return {
			label: ds.label,
			slug: ds.extension.slug,
			topic: ds.extension.topic,
			subTopic: ds.extension.subTopic,
			description: ds.extension.subtitle
		};

	const metadata = {
		label: ds.label,
		...ds.extension,
		updated: ds.updated,
		caveats: ds.note
	};
	metadata.dimensions = Object.fromEntries(
		ds.id.map((key, i) => [key, { ...formatDimension(ds, key, fullDims), order: i }])
	);
	return metadata;
}

function arrayToLookup(metadata) {
	const lookup = {};
	for (const ds of metadata) lookup[ds.slug] = ds;
	return lookup;
}

export default function getIndicators(params = {}) {
	const filter = makeDatasetFilter(
		params.indicator,
		params.topic,
		params.excludeMultivariate,
		params.hasGeo,
		params.hasYear
	);
	if (filter.error) return filter;

	const metadata = rawMetadata.link.item
		.filter(filter)
		.map((ds) => formatMetadata(ds, params.minimalMetadata, params.fullDims));

	return params.singleIndicator
		? metadata[0]
		: params.asLookup
			? arrayToLookup(metadata)
			: metadata;
}
