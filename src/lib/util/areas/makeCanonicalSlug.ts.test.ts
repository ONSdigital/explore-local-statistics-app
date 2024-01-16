import { makeCanonicalSlug } from './makeCanonicalSlug';

describe('makeCanonicalSlug', () => {
	it('should create a slug from valid code and name', () => {
		expect(makeCanonicalSlug('K02000001', 'United Kingdom')).toBe('K02000001-united-kingdom');
		expect(makeCanonicalSlug('E12000008', 'South East')).toBe('E12000008-south-east');
	});

	it('should handle names with special characters', () => {
		expect(makeCanonicalSlug('E12000003', 'Yorkshire & The Humber')).toBe(
			'E12000003-yorkshire-the-humber'
		);
	});

	it('should handle names with extra spaces', () => {
		expect(makeCanonicalSlug('E12000002', '  North West  ')).toBe('E12000002-north-west');
	});

	it('throws an error when name is empty', () => {
		expect(() => makeCanonicalSlug('E12000011', '')).toThrow('No area name was given');
	});

	it('throws an error when name is not provided', () => {
		expect(() => makeCanonicalSlug('E12000012', undefined as unknown as string)).toThrow(
			'No area name was given'
		);
	});
});
