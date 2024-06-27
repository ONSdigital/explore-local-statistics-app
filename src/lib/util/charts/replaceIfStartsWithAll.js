export function replaceIfStartsWithAll(str) {
	if (str.startsWith('All ')) {
		// Remove the first four characters and capitalize the first character of the resulting string
		const slicedString = str.slice(4);
		const capitalizedString = slicedString.charAt(0).toUpperCase() + slicedString.slice(1);
		return capitalizedString;
	}
	return str; // Return the original string if it doesn't start with "All "
}
