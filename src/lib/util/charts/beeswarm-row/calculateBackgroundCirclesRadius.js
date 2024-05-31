export function calculateBackgroundCirclesRadius(value, breakpoints) {
	let result;
	for (const breakpoint in breakpoints) {
		if (value < breakpoint) {
			result = breakpoints[breakpoint];
			break;
		}
	}

	// If no breakpoint is found, use the default output (if provided)
	if (result === undefined && 'default' in breakpoints) {
		result = breakpoints['default'];
	}

	return result;
}
