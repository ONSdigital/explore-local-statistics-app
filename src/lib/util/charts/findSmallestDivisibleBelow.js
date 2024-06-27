export function findSmallestDivisibleBelow(targetNumber, divisor) {
	// Calculate the remainder when dividing the target number by the divisor
	let remainder = targetNumber % divisor;

	// If the remainder is 0, the target number is already divisible by the divisor
	if (remainder === 0) {
		return targetNumber;
	}

	// Calculate the difference needed to reach the previous multiple of the divisor
	let difference = remainder;

	// Calculate the smallest number below the target number that is divisible by the divisor
	let smallestDivisibleBelow = targetNumber - difference;

	return smallestDivisibleBelow;
}
