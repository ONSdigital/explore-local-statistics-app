import { formatDimension } from './helpers/formatMetadata';
import readData from '$lib/data';

const rawMetadata = await readData('json-stat-metadata');

export default function getDimensions(params = {}) {
	// Get relevant indicator from all metadata
	const indicator = rawMetadata.link.item.find((ds) => ds.extension.slug === params.indicator);
	if (!indicator) return { error: 404, message: `Indicator code "${params.indicator}" not found.` };

	// If filtered for single dimension
	if (params.dimension) {
		if (indicator.dimension[params.dimension]) {
			return formatDimension(indicator, params.dimension);
		} else {
			return { error: 404, message: `Dimension code "${params.dimension}" not found.` };
		}
	}

	// Otherwise return all dimensions
	return indicator.id.map((key) => formatDimension(indicator, key));
}
