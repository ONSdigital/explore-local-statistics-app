export function median(xs: number[]) {
	if (xs.length === 0) {
		throw new Error("Can't compute median of an empty array.");
	}
	for (const x of xs) {
		if (!Number.isFinite(x)) {
			throw new Error(`Expected finite number; got ${x}`);
		}
	}

	const sorted = [...xs].sort((a, b) => a - b);
	if (sorted.length % 2) {
		// The array has an odd number of elements
		return sorted[Math.floor(sorted.length / 2)];
	}

	// The array has an even number of elements
	const position = Math.floor(sorted.length / 2);
	const a = sorted[position - 1];
	const b = sorted[position];
	return (a + b) / 2;
}

export function mad(xs: number[], constant = 1.4826) {
	const med = median(xs);
	const absDeviations = xs.map((x) => Math.abs(x - med));
	return constant * median(absDeviations);
}
