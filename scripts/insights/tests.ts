import { median, mad } from './stats.ts';
import { toLookup, toNestedLookup, uniqueValues } from './data-utils.ts';
import { readCsvAutoType } from './io.ts';

runTests();

function runTests() {
	testStats();
	testDataUtils();
	testIo();
}

function testStats() {
	assertEqual(median([5]), 5, 'Correct median of one number.');
	assertEqual(median([14, 15]), 14.5, 'Correct median of 2 numbers.');
	assertEqual(median([14, 16]), 15, 'Correct median of 2 numbers.');
	assertEqual(median([14, 15, 16]), 15, 'Correct median of 3 numbers.');
	assertEqual(median([14, 15, 16, 20]), 15.5, 'Correct median of 4 numbers.');
	assertEqual(median([14, 15, 17, 20]), 16, 'Correct median of 4 numbers.');
	assertEqual(median([1, 4, 9, 16]), 6.5, 'Correct median of 4 numbers.');
	assertEqual(median([11, 14, 15, 16, 25]), 15, 'Correct median of 5 numbers.');
	assertEqual(median([16, 14, 15]), 15, 'Correct median of 3 numbers, not sorted.');
	assertThrows((_) => median([]), 'Median of empty array should throw an error.');
	assertThrows((_) => median([null]), 'Median of null should throw an error.');

	assertEqual(mad([1, 2, 3]), 1.4826, 'Correct MAD.');
	assertEqual(mad([1, 2, 3], 2), 2, 'Correct MAD with constant.');
	assertEqual(mad([1, 4, 9]), 4.4478, 'Correct MAD.');
	assertEqual(mad([1, 4, 9, 16]), 5.9304, 'Correct MAD.');
}

function testDataUtils() {
	const arr1 = [1, 2, 3, 2, 1];
	assertEqual(uniqueValues(arr1).length, 3, 'Correct number of unique values: numbers.');
	const arr2 = ['a', 'b', 'c', 'b', 'a'];
	assertEqual(uniqueValues(arr2).length, 3, 'Correct number of unique values: numbers.');

	const data1 = [
		{ code: 'a', value: 1 },
		{ code: 'b', value: 2 }
	];
	const lookup1 = toLookup(data1, 'code', 'value');
	assertEqual(lookup1['a'], 1, 'Lookup has correct value.');
	assertEqual(lookup1['b'], 2, 'Lookup has correct value.');

	const data2 = [
		{ code: 'a', value: 1 },
		{ code: 'b', value: 2 },
		{ code: 'b', value: 3 }
	];
	assertThrows(
		() => toLookup(data2, 'code', 'value'),
		"Don't allow duplicate key when creating lookup."
	);

	const lookup3 = toLookup(data1, 'code');
	assertEqual(lookup3['a'].code, 'a', 'Lookup has correct value.');
	assertEqual(lookup3['a'].value, 1, 'Lookup has correct value.');

	const data3 = [
		{ code: 'a', code2: 'x', value: 1 },
		{ code: 'b', code2: 'x', value: 2 },
		{ code: 'b', code2: 'y', value: 3 }
	];
	const nestedLookup1 = toNestedLookup(data3, ['code'], 'value');
	assertEqual(nestedLookup1.get('a').length, 1, 'Correct nested lookup.');
	assertEqual(nestedLookup1.get('b').length, 2, 'Correct nested lookup.');
	const nestedLookup2 = toNestedLookup(data3, ['code', 'code2'], 'value');
	assertEqual(nestedLookup2.get('a').get('x')[0], 1, 'Correct nested lookup.');
	assertEqual(nestedLookup2.get('b').get('x')[0], 2, 'Correct nested lookup.');
	assertEqual(nestedLookup2.get('b').get('y')[0], 3, 'Correct nested lookup.');
}

function testIo() {
	readCsvAutoType('scripts/insights/test-fixtures/one-type-per-column.csv'); // Shouldn't throw error

	assertThrows(
		() => readCsvAutoType('scripts/insights/test-fixtures/too-many-types-in-a-column.csv'),
		'Throw error if more than one type exists in a CSV column.'
	);
}

function assertEqual(x, y, message) {
	if (x !== y) {
		console.log('Test failed:', x, '!==', y, message);
	}
}

function assertThrows(f, message) {
	let threw = false;
	try {
		f();
	} catch (e) {
		threw = true;
	}

	if (!threw) {
		console.log('Test failed:', message);
	}
}
