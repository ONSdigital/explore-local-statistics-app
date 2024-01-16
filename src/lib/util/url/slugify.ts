export function slugify(text: string) {
	const matches = text
		.toLowerCase()
		.replace(/'/g, '') // remove apostrophes since we don't want to split apostrophised words
		.match(/[a-zA-Z0-9]+/g); // match alphanumeric sequences

	return matches ? matches.join('-') : '';
}
