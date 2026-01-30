function dimsToIndex(dims) {
	let index = 0;
	for (const dim of dims) index = index * dim.count + dim.value[1];
	return index;
}

// Checks if one or more non-NULL observations exist for a set of dimensions
export default function hasObservation(ds, dimVals) {
	const dims = [];
	for (let i = 0; i < ds.id.length; i++) {
		const key = ds.id[i];
		if (dimVals[key]) {
			if (dimVals[key] in ds.dimension[key].category.index)
				dims.push({
					key,
					count: ds.size[i],
					value: [dimVals[key], ds.dimension[key].category.index[dimVals[key]]]
				});
			else return false;
		} else {
			const cat = Object.entries(ds.dimension[key].category.index)[0];
			dims.push({ key, count: ds.size[i], value: cat });
		}
	}
	const index = dimsToIndex(dims);

	return ds.value[index] != null;
}
