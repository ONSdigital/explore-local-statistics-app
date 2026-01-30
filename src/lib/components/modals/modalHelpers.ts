export function cloneState(obj) {
	const clone = {};
	for (const key in obj) {
		if (Array.isArray(obj[key])) clone[key] = [...obj[key]];
		else clone[key] = obj[key];
	}
	return clone;
}
