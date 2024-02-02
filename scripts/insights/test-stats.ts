import { median, mad } from './stats.ts';

runTests();

function runTests() {
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
