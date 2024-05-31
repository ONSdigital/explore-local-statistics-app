export function makeClusterDescriptions(descriptions) {
	const obj = {};
	for (const d of descriptions) {
		if (!obj[d.type]) obj[d.type] = {};
		obj[d.type][d.letter] = d.text;
	}
	return obj;
}
