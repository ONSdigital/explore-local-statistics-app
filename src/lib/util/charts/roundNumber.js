export function roundNumber(number, decimalPlaces) {
	let roundingFactor = Math.pow(10, decimalPlaces);

	return (Math.round(number * roundingFactor) / roundingFactor).toFixed(decimalPlaces);
}
