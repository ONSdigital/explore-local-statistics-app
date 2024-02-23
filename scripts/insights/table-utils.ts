import ColumnTable from 'arquero/dist/types/table/column-table';

/**
 * Join two tables on a single column.
 *
 * Optionally, throw an error if there are values in the join column that don't appear in both tables.
 * @param tableA
 * @param tableB
 * @param on
 * @param param3
 * @returns
 */
export function checkedJoin(
	tableA: ColumnTable,
	tableB: ColumnTable,
	on: string,
	{ expectAllOnLeft = true, expectAllOnRight = true } = {}
): ColumnTable {
	const setA = new Set(tableA.array(on));
	const setB = new Set(tableB.array(on));
	let setsDiffer = false;

	if (expectAllOnLeft && [...setB].some((d) => !setA.has(d))) {
		setsDiffer = true;
		console.log('Present in right set but not in left:');
		console.log([...setB].filter((d) => !setA.has(d)));
	}
	if (expectAllOnRight && [...setA].some((d) => !setB.has(d))) {
		setsDiffer = true;
		console.log('Present in left set but not in right:');
		console.log([...setA].filter((d) => !setB.has(d)));
	}
	if (setsDiffer) {
		throw new Error(
			`The column "${on}" used for joining has different sets of values in the two tables!`
		);
	}
	return tableA.join_left(tableB, [on]);
}
