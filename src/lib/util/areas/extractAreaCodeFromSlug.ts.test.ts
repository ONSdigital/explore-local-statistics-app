import { describe, it, expect } from 'vitest';
import { extractAreaCodeFromSlug } from './extractAreaCodeFromSlug';

describe('extractAreaCodeFromSlug', () => {
	it('should extract valid area code', () => {
		expect(extractAreaCodeFromSlug('E12000008-south-east')).toEqual({
			kind: 'Success',
			type: 'E12',
			value: 'E12000008'
		});
		expect(extractAreaCodeFromSlug('K02000001-united-kingdom')).toEqual({
			kind: 'Success',
			type: 'K02',
			value: 'K02000001'
		});
	});

	it('should return Failure for invalid area code', () => {
		expect(extractAreaCodeFromSlug('invalid-code')).toEqual({ kind: 'Failure' });
		expect(extractAreaCodeFromSlug('12345678')).toEqual({ kind: 'Failure' });
	});

	it('should return Failure for empty slug', () => {
		expect(extractAreaCodeFromSlug('')).toEqual({ kind: 'Failure' });
	});
});
