/* eslint-disable @typescript-eslint/no-explicit-any */

const cdnUrl = 'https://ons-dp-prod-cdn.s3.eu-west-2.amazonaws.com/maptiles/ap-geos/v2';

type GetAreaResult =
	| { kind: 'Success'; place: any; geometry: any }
	| { kind: 'Failure'; status: number };

export const getArea = async (
	fetch: typeof window.fetch,
	typeCode: string,
	code: string
): Promise<GetAreaResult> => {
	const result = await fetch(`${cdnUrl}/${typeCode}/${code}.json`);

	if (result.ok) {
		const parsed = await result.json();

		// json.properties.childTypes = makeChildTypes(json.properties.child_typecds);

		return {
			kind: 'Success',
			place: parsed.properties,
			//   type: geoCodesLookup[typeCode],
			geometry: parsed.properties.end ? parsed.geometry : null
		};
	} else {
		return { kind: 'Failure', status: result.status };
	}
};

// const makeChildTypes = (childcds) => {
// 	let childTypes = Array.from(
// 		new Set(childcds.sort((a, b) => a.localeCompare(b)).map((cd) => geoCodesLookup[cd]))
// 	).filter((d, i, arr) => arr.map((a) => a.key).indexOf(d.key) === i);
// 	const filterKeys = ['cauth', 'utla', 'ltla'].filter((key) =>
// 		childTypes.map((t) => t.key).includes(key)
// 	);
// 	if (filterKeys.length > 1)
// 		childTypes = childTypes.filter((ct) => !filterKeys.slice(1).includes(ct.key));
// 	const sortKeys = geoTypes.map((g) => g.key);
// 	return childTypes.sort((a, b) => sortKeys.indexOf(a.key) - sortKeys.indexOf(b.key));
// };
