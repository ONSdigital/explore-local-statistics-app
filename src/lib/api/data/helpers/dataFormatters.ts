import readData from '$lib/data';

const areaNameLookup = await readData('areas-in-data');

// Makes a code => name lookup from an array of GSS codes
function makeAreaLookup(codes: string[]) {
	return Object.fromEntries(codes.map((cd) => [cd, areaNameLookup[cd] || null]));
}

// Map an array of dimension values to their corresponding labels
function dimValuesToLabels(dim: filteredDimension, cube: jsonStatDataset) {
	if (cube.dimension[dim.key].category.label)
		dim.values = dim.values.map((v) => [cube.dimension[dim.key].category.label[v[0]], v[1]]);
}

// Take filtered dims and expand to array of all the values they represent
export function dimsToItems(dims: filteredDimension[], cube: jsonStatDataset) {
	let items: dataItem[] = [[0]];
	for (const dim of dims) {
		dimValuesToLabels(dim, cube);
		const newItems: dataItem[] = [];
		for (const item of items) {
			for (const val of dim.values) {
				newItems.push([item[0] * dim.count + val[1], ...item.slice(1), val[0]]);
			}
		}
		items = newItems;
	}
	return items;
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

		if (dim.values.length !== 1) {
			const newIndices = [];
			// const newIndices = Array(indices.length * size);
			// let j = 0;
			for (const index of indices) {
				for (const val of dim.values) {
					newIndices.push(index * dim.count + val[1]);
					// newIndices[j] = (index * dim.count) + val[1];
					// j ++;
				}
			}
			indices = newIndices;
			// indices = indices.flatMap(index => dim.values.map(val => (index * dim.count) + val[1]));
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
// Running this saves a number of condiditional tests for each individual row added
function makeColFill(
	groupByArea: boolean,
	includeNames: boolean,
	includeStatus: boolean,
	dims: filteredDimension[],
	measures: filteredDimension,
	pivotMeasures: boolean
) {
	const measuresCount = measures.count;

	const valueDimIndex = getValueDimIndex(measures);
	const getIndex = pivotMeasures
		? (item) => item[0] * measuresCount + valueDimIndex
		: (item) => item[0];
	const hasVals = includeStatus
		? (item: dataItem, cube: jsonStatDataset) => {
				const index = getIndex(item);
				return cube.value[index] || cube.status[index];
			}
		: (item: dataItem, cube: jsonStatDataset) => cube.value[getIndex(item)];

	const pushMeasures = pivotMeasures
		? (data: jsonDataCols, item: dataItem, cube: jsonStatDataset) => {
				for (let j = 0; j < measures.values.length; j++) {
					data[measures.values[j][0]].push(
						cube.value[item[0] * measuresCount + measures.values[j][1]]
					);
				}
			}
		: (data: jsonDataCols, item: dataItem, cube: jsonStatDataset) =>
				data.value.push(cube.value[item[0]]);

	const dimStart = groupByArea ? 1 : 0;
	const dimEnd = !pivotMeasures && measuresCount > 1 ? dims.length : dims.length - 1;
	const pushVals = (
		data: jsonDataCols,
		item: dataItem,
		dims: filteredDimension[],
		cube: jsonStatDataset
	) => {
		for (let i = dimStart; i < dimEnd; i++) data[dims[i].key].push(item[i + 1]);
		pushMeasures(data, item, cube);
	};
	const pushName = (data: jsonDataCols, item: dataItem) =>
		data.areanm.push(areaNameLookup[item[1]] || null);
	const pushStatus = pivotMeasures
		? (data: jsonDataCols, item: dataItem, cube: jsonStatDataset) =>
				data.status.push(cube.status[item[0] * measuresCount] || null)
		: (data: jsonDataCols, item: dataItem, cube: jsonStatDataset) =>
				data.status.push(cube.status[item[0]] || null);

	return includeNames && includeStatus
		? (data: jsonDataCols, item: dataItem, dims: filteredDimension[], cube: jsonStatDataset) => {
				if (hasVals(item, cube)) {
					pushVals(data, item, dims, cube);
					pushName(data, item);
					pushStatus(data, item, cube);
				}
			}
		: includeNames
			? (data: jsonDataCols, item: dataItem, dims: filteredDimension[], cube: jsonStatDataset) => {
					if (hasVals(item, cube)) {
						pushVals(data, item, dims, cube);
						pushName(data, item);
					}
				}
			: includeStatus
				? (
						data: jsonDataCols,
						item: dataItem,
						dims: filteredDimension[],
						cube: jsonStatDataset
					) => {
						if (hasVals(item, cube)) {
							pushVals(data, item, dims, cube);
							pushStatus(data, item, cube);
						}
					}
				: (
						data: jsonDataCols,
						item: dataItem,
						dims: filteredDimension[],
						cube: jsonStatDataset
					) => {
						if (hasVals(item, cube)) pushVals(data, item, dims, cube);
					};
}

export function itemsToCols(
	cube: jsonStatDataset,
	dims: filteredDimension[],
	items: dataItem[],
	measures: filteredDimension,
	pivotMeasures: boolean,
	includeNames: boolean,
	includeStatus: boolean,
	groupByArea: boolean
): jsonDataCols | jsonDataColsByArea {
	const colFill = makeColFill(
		groupByArea,
		groupByArea ? false : includeNames,
		includeStatus,
		dims,
		measures,
		pivotMeasures
	);
	const measuresLength = measures.values.length;
	const dimsEnd = !pivotMeasures && measuresLength > 1 ? undefined : -1;

	if (groupByArea) {
		const data: jsonDataColsByArea = [];
		const cols = dims.slice(1, dimsEnd);
		let currentArea = null;
		for (const item of items) {
			if (item[1] !== currentArea?.areacd) {
				const newArea = {
					areacd: item[1],
					...(includeNames && { areanm: areaNameLookup[item[1]] || null }),
					values: {}
				};
				for (const col of cols) {
					newArea.values[col.key] = [];
				}
				for (const val of pivotMeasures ? measures.values : [['value']])
					newArea.values[val[0]] = [];
				if (includeStatus) newArea.values.status = [];
				data.push(newArea);
				currentArea = data[data.length - 1];
			}
			colFill(currentArea.values, item, dims, cube);
		}
		return data;
	} else {
		const data: jsonDataCols = {};
		for (const dim of dims.slice(0, dimsEnd)) {
			data[dim.key] = [];
			if (includeNames && dim.key === 'areacd') data.areanm = [];
		}
		for (const val of pivotMeasures ? measures.values : [['value']]) data[val[0]] = [];
		if (includeStatus) data.status = [];
		for (const item of items) {
			colFill(data, item, dims, cube);
		}
		return data;
	}
}

export function toCols(
	cube: jsonStatDataset,
	dims: filteredDimension[],
	includeNames: boolean,
	includeStatus: boolean,
	groupByArea = false,
	pivotMeasures = true
) {
	const measures = dims[dims.length - 1];

	const items = dimsToItems(!pivotMeasures ? dims : dims.slice(0, -1), cube);
	const data = itemsToCols(
		cube,
		dims,
		items,
		measures,
		pivotMeasures,
		includeNames,
		includeStatus,
		groupByArea
	);

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
	groupByArea = false,
	pivotMeasures = true
): jsonDataRow[] | jsonDataRowsByArea {
	const measures = dims[dims.length - 1];
	if (measures.values.length === 0) return [];

	const items = dimsToItems(!pivotMeasures ? dims : dims.slice(0, -1), cube);
	const cols = itemsToCols(
		cube,
		dims,
		items,
		measures,
		pivotMeasures,
		includeNames,
		includeStatus,
		groupByArea
	);

	const rows = groupByArea
		? cols.map((d) => {
				const area = {
					areacd: d.areacd,
					...(includeNames && { areanm: d.areanm }),
					values: colsToRows(d.values)
				};
				return area;
			})
		: colsToRows(cols, includeIndicator ? cube.label : null);

	return [cube.extension.slug, rows];
}
