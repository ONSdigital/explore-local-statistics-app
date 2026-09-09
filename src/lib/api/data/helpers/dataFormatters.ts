import areaNameLookup from '$lib/data/areas-in-data.json';

// Makes a code => name lookup from an array of GSS codes
function makeAreaLookup(codes: string[]) {
	return Object.fromEntries(codes.map((cd) => [cd, areaNameLookup[cd] || null]));
}

// Map an array of dimension values to their corresponding labels
function dimValuesToLabels(dim: filteredDimension, cube: jsonStatDataset) {
	if (cube.dimension[dim.key].category.label)
		dim.values = dim.values.map((v) => [cube.dimension[dim.key].category.label[v[0]], v[1]]);
}

// Take filtered dims and use them to return a filtered JSON-Stat dataset
export function toJSONStat(
	qb: jsonStatDataset,
	dims: filteredDimension[],
	includeNames = false,
	includeStatus = false
) {
	const cube: jsonStatDataset = {};
	for (const key of Object.keys(qb).filter((key: string) => !['value', 'status'].includes(key)))
		cube[key] = structuredClone(qb[key]);

	let indices = [0];

	for (let i = 0; i < dims.length; i++) {
		const dim = dims[i];
		const size = dim.values.length;

		if (dim.count !== 1) {
			const newIndices = [];

			for (const index of indices) {
				for (const val of dim.values) {
					newIndices.push(index * dim.count + val[1]);
				}
			}
			indices = newIndices;
		}

		cube.dimension[dim.key].category.index = Object.fromEntries(
			dim.values.map((val, i) => [val[0], i])
		);
		if (cube.dimension[dim.key].category.label && size < cube.size[i]) {
			const label = {};
			for (const val of dim.values) label[val[1]] = qb.dimension[dim.key].category.label[val[1]];
			cube.dimension[dim.key].category.label = label;
		}
		cube.size[i] = size;
		if (includeNames)
			cube.dimension.areacd.category.label = makeAreaLookup(
				Object.keys(cube.dimension.areacd.category.index)
			);
	}

	const value = Array(indices.length).fill(null);

	if (includeStatus) {
		cube.status = {};
		for (let i = 0; i < indices.length; i++) {
			value[i] = qb.value[indices[i]];
			if (qb.status[indices[i]]) cube.status[indices[i]] = qb.status[indices[i]];
		}
	} else {
		for (let i = 0; i < indices.length; i++) {
			value[i] = qb.value[indices[i]];
		}
	}

	cube.value = value;

	return cube;
}

// Get the primary key/column for values in the dataset
function getValueDimIndex(measures: filteredDimension) {
	const keys = measures.values.map((val) => val?.[0]);
	const valueIndex = keys.indexOf('value');
	return valueIndex > -1 ? valueIndex : 0;
}

// This function runs once to generate the most optimal function to fill columns based on the global params
// Running this saves a number of condiditional tests for each individual row added.
// It's also where the actual output arrays get resolved: `data` already has all its
// (empty) column arrays created by the caller, and every push function below captures
// a direct reference to the array it fills (`colArrays`, `measureArrays`, `areanmArr`,
// `statusArr`) once here, rather than doing a `data[dims[i].key]`-style property lookup
// on every single item - the lookup is the same for every item, so there's no need to
// repeat it per item.
function makeColFill(
	data: jsonDataCols,
	includeNames: boolean,
	includeStatus: boolean,
	dims: filteredDimension[],
	measures: filteredDimension,
	pivotMeasures: boolean
) {
	const measuresCount = measures.count;
	const valueDimIndex = getValueDimIndex(measures);

	const hasVals = pivotMeasures
		? includeStatus
			? (item: dataItem, cube: jsonStatDataset) => {
					const index = item.index * measuresCount + valueDimIndex;
					return cube.value[index] != null || cube.status[index];
				}
			: (item: dataItem, cube: jsonStatDataset) =>
					cube.value[item.index * measuresCount + valueDimIndex] != null
		: includeStatus
			? (item: dataItem, cube: jsonStatDataset) =>
					cube.value[item.index] != null || cube.status[item.index]
			: (item: dataItem, cube: jsonStatDataset) => cube.value[item.index] != null;

	const dimEnd = !pivotMeasures && measuresCount > 1 ? dims.length : dims.length - 1;
	const colArrays = dims.slice(0, dimEnd).map((dim) => data[dim.key]);
	const measureArrays = measures.values.map((val) => [data[val[0]], val[1]] as [unknown[], number]);
	const valueArr = data.value;

	const pushMeasures = pivotMeasures
		? (item: dataItem, cube: jsonStatDataset) => {
				for (const [arr, offset] of measureArrays) arr.push(cube.value[item.index * measuresCount + offset]);
			}
		: (item: dataItem, cube: jsonStatDataset) => valueArr.push(cube.value[item.index]);

	const pushVals = (item: dataItem, cube: jsonStatDataset) => {
		for (let i = 0; i < dimEnd; i++) colArrays[i].push(item.values[i]);
		pushMeasures(item, cube);
	};

	const areanmArr = data.areanm;
	const pushName = (item: dataItem) => areanmArr.push(areaNameLookup[item.values[0]] || null);

	const statusArr = data.status;
	const pushStatus = pivotMeasures
		? (item: dataItem, cube: jsonStatDataset) => statusArr.push(cube.status[item.index * measuresCount] || null)
		: (item: dataItem, cube: jsonStatDataset) => statusArr.push(cube.status[item.index] || null);

	return includeNames && includeStatus
		? (item: dataItem, cube: jsonStatDataset) => {
				if (hasVals(item, cube)) {
					pushVals(item, cube);
					pushName(item);
					pushStatus(item, cube);
				}
			}
		: includeNames
			? (item: dataItem, cube: jsonStatDataset) => {
					if (hasVals(item, cube)) {
						pushVals(item, cube);
						pushName(item);
					}
				}
			: includeStatus
				? (item: dataItem, cube: jsonStatDataset) => {
						if (hasVals(item, cube)) {
							pushVals(item, cube);
							pushStatus(item, cube);
						}
					}
				: (item: dataItem, cube: jsonStatDataset) => {
						if (hasVals(item, cube)) pushVals(item, cube);
					};
}

// Expand the (non-measure) dims into every combination they represent and fill the
// output columns directly, one dimension at a time, instead of first materializing
// a flat array of `{ index, values }` items (one object + one copied array per
// combination) and then walking that to fill columns. For a cartesian product of any
// real size that intermediate array is by far the most expensive part of building
// cols/rows output - fusing the two steps means only a single reused index/values
// buffer is needed, not one allocation per combination.
export function dimsToCols(
	cube: jsonStatDataset,
	dims: filteredDimension[],
	measures: filteredDimension,
	pivotMeasures: boolean,
	includeNames: boolean,
	includeStatus: boolean
): jsonDataCols | jsonDataColsByArea {
	const iterDims = pivotMeasures ? dims.slice(0, -1) : dims;
	for (const dim of iterDims) dimValuesToLabels(dim, cube);

	const measuresLength = measures.values.length;
	const dimsEnd = !pivotMeasures && measuresLength > 1 ? undefined : -1;

	const data: jsonDataCols = {};
	for (const dim of dims.slice(0, dimsEnd)) {
		data[dim.key] = [];
		if (includeNames && dim.key === 'areacd') data.areanm = [];
	}
	for (const val of pivotMeasures ? measures.values : [['value']]) data[val[0]] = [];
	if (includeStatus) data.status = [];

	// `data`'s arrays already exist by this point, so `colFill` can capture direct
	// references to them instead of doing a fresh property lookup per item.
	const colFill = makeColFill(data, includeNames, includeStatus, dims, measures, pivotMeasures);

	// A single item is reused across every combination - colFill only ever reads
	// primitive values out of it before the next combination overwrites them.
	const item: dataItem = { index: 0, values: new Array(iterDims.length) };
	const depthEnd = iterDims.length - 1;

	function fill(depth: number, index: number) {
		const dim = iterDims[depth];
		if (depth === depthEnd) {
			for (const val of dim.values) {
				item.values[depth] = val[0];
				item.index = index * dim.count + val[1];
				colFill(item, cube);
			}
		} else {
			for (const val of dim.values) {
				item.values[depth] = val[0];
				fill(depth + 1, index * dim.count + val[1]);
			}
		}
	}
	if (iterDims.length > 0) fill(0, 0);
	else colFill(item, cube);

	return data;
}

export function toCols(
	cube: jsonStatDataset,
	dims: filteredDimension[],
	includeNames: boolean,
	includeStatus: boolean,
	pivotMeasures = true
) {
	const measures = dims[dims.length - 1];
	const data = dimsToCols(cube, dims, measures, pivotMeasures, includeNames, includeStatus);

	return [cube.extension.slug, data];
}

function colsToRows(cols: jsonDataCols, indicator = null) {
	const ind = indicator ? { indicator } : null;

	const rows: jsonDataRow[] = [];

	const colKeys = Object.keys(cols);
	const makeRow = (i: number) => {
		const row: jsonDataRow = { ...ind };
		for (const key of colKeys) row[key] = cols[key][i];
		return row;
	};

	const count = cols[colKeys[0]].length;
	for (let i = 0; i < count; i++) {
		rows.push(makeRow(i));
	}
	return rows;
}

export function toRows(
	cube: jsonStatDataset,
	dims: filteredDimension[],
	includeIndicator: boolean,
	includeNames: boolean,
	includeStatus: boolean,
	pivotMeasures = true
): jsonDataRow[] | jsonDataRowsByArea {
	const measures = dims[dims.length - 1];
	if (measures.values.length === 0) return [];

	const cols = dimsToCols(cube, dims, measures, pivotMeasures, includeNames, includeStatus);

	const rows = colsToRows(cols, includeIndicator ? cube.label : null);

	return [cube.extension.slug, rows];
}
