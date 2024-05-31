export function getSelectedAreas(selectionsObject, accordionSection) {
	return (
		Array.isArray(selectionsObject[accordionSection.chosenKey + '-visible'])
			? selectionsObject[accordionSection.chosenKey + '-visible'].length > 0
				? selectionsObject[accordionSection.chosenKey + '-visible']
				: []
			: [selectionsObject[accordionSection.chosenKey + '-visible']]
	).filter((d) => d);
}
