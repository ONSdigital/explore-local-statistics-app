export function generateDivisibleNumbersWithinRange(range, divisor) {
	const result = [];

	for (let num = Math.ceil(range[0] / divisor) * divisor; num <= range[1]; num += divisor) {
		// Use toFixed to limit the number of decimal places
		const formattedNumber = parseFloat(num.toFixed(getDecimalPlaces(divisor)));
		result.push(formattedNumber);
	}

	return result;
}
