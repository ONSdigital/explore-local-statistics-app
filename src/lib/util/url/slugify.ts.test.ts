import { it, expect } from 'vitest';

import { slugify } from './slugify';

it('removes punctuation', () => {
	expect(slugify('Hello, World!')).toBe('hello-world');
});

it('handles apostrophes', () => {
	expect(slugify("It's a test")).toBe('its-a-test');
});

it('removes leading and trailing hyphens', () => {
	expect(slugify('-Hello World-')).toBe('hello-world');
});

it('replaces multiple non-alphanumeric characters with a single hyphen', () => {
	expect(slugify('Hello... World!!')).toBe('hello-world');
});

it('returns an empty string for strings with no alphanumeric characters', () => {
	expect(slugify('!!!')).toBe('');
});

it('handles strings with numbers', () => {
	expect(slugify("L3t's t3st 123")).toBe('l3ts-t3st-123');
});

it('maintains case insensitivity', () => {
	expect(slugify('HeLLo WoRLd')).toBe('hello-world');
});
