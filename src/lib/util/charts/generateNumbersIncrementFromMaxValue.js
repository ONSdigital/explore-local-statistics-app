export function generateNumbersIncrementFromMaxValue(range, increment) {
	const result = [];

	for (let i = range[1]; i >= range[0]; i -= increment) {
		result.push(parseInt(i));
	}

	return result;
}
