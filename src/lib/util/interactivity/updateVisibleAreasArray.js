export function updateVisibleAreasArray(
	chosen,
	relatedAreasBoolean,
	parentAndRelatedAreasObject,
	areasObject
) {
	if (relatedAreasBoolean) {
		return chosen && chosen != 'none'
			? {
					group: chosen,
					label: parentAndRelatedAreasObject.groups[chosen].labels.related,
					role: 'related',
					areas: parentAndRelatedAreasObject.groups[chosen].areas,
					codes: parentAndRelatedAreasObject.groups[chosen].codes
				}
			: null;
	} else {
		return chosen
			? Array.isArray(chosen)
				? chosen.map((el) =>
						assignRole(el, relatedAreasBoolean, parentAndRelatedAreasObject, areasObject, 'custom')
					)
				: Object.keys(parentAndRelatedAreasObject.groups).includes(chosen)
					? {
							group: chosen,
							label: parentAndRelatedAreasObject.groups[chosen].labels.comparison,
							role: 'comparison'
						}
					: assignRole(
							chosen,
							relatedAreasBoolean,
							parentAndRelatedAreasObject,
							areasObject,
							'comparison'
						)
			: null;
	}
}

function assignRole(
	element,
	relatedAreasBoolean,
	parentAndRelatedAreasObject,
	areasObject,
	ifNotParent
) {
	if (element === 'none') {
		return null;
	} else {
		let role =
			parentAndRelatedAreasObject.parent && parentAndRelatedAreasObject.parent.areacd === element
				? 'parent'
				: parentAndRelatedAreasObject.country &&
					  parentAndRelatedAreasObject.country.areacd === element
					? 'country'
					: parentAndRelatedAreasObject.uk && parentAndRelatedAreasObject.uk.areacd === element
						? 'uk'
						: ifNotParent;
		return {
			...areasObject[element],
			role: role
		};
	}
}
