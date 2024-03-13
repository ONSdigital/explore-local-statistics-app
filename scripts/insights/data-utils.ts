export function toLookup(data, keyName: string, valueName: string | null = null) {
	const lookup = {};

	for (const item of data) {
		if (item[keyName] in lookup) {
			throw new Error(`key ${item[keyName]} already exists in lookup.`);
		}
		if (valueName == null) {
			lookup[item[keyName]] = item;
		} else {
			lookup[item[keyName]] = item[valueName];
		}
	}
	return lookup;
}

export function toLookupWithMultipleValues(data, keyName: string, valueName: string | null = null) {
	const lookup = {};

	for (const item of data) {
		if (!(item[keyName] in lookup)) {
			lookup[item[keyName]] = [];
		}
		if (valueName == null) {
			lookup[item[keyName]].push(item);
		} else {
			lookup[item[keyName]].push(item[valueName]);
		}
	}
	return lookup;
}

export function toNestedLookup(data, keys, valueName) {
	const lookup = new Map();
	for (const item of data) {
		let map = lookup;
		for (const key of keys.slice(0, -1)) {
			if (!map.has(item[key])) {
				map.set(item[key], new Map());
			}
			map = map.get(item[key]);
		}
		const lastKey = keys[keys.length - 1];
		if (!map.has(item[lastKey])) {
			map.set(item[lastKey], []);
		}
		map.get(item[lastKey]).push(valueName == null ? item : item[valueName]);
	}
	return lookup;
}

export function uniqueValues(arr) {
	const set = new Set();
	for (const item of arr) {
		set.add(item);
	}
	return Array.from(set);
}
