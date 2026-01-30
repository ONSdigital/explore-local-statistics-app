export function formatDimension(indicator, dimension, fullDims = true) {
	const dim = {
		id: dimension,
		label: indicator.dimension[dimension].label
	};
	if (fullDims) dim.category = indicator.dimension[dimension].category;
	return dim;
}
