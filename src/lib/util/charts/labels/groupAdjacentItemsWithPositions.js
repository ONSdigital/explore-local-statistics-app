export function groupAdjacentItemsWithPositions(arr) {
	const result = {};
	let currentGroup = [];
	let currentGroupIndex = -1;

	for (let i = 0; i < arr.length; i++) {
		const currentItem = arr[i];
		const previousItem = arr[i - 1];

		// Start a new group if:
		// - It's the first item
		// - The current group is empty
		// - The current item's groupIdentifier is different from the previous item's groupIdentifier
		if (
			!previousItem ||
			currentGroup.length === 0 ||
			currentItem.labelOffset !== previousItem.labelOffset
		) {
			// If currentGroup is not empty, add positions to result for items in the previous group
			if (currentGroup.length > 0) {
				currentGroup.forEach((itemId, index) => {
					result[itemId] = {
						groupLength: currentGroup.length,
						groupPosition: index
					};
				});
			}
			// Start a new group
			currentGroup = [currentItem.datum.areacd];
			currentGroupIndex++;
		} else {
			// Add the item to the current group
			currentGroup.push(currentItem.datum.areacd);
		}
	}

	// Add positions to result for items in the last group
	if (currentGroup.length > 0) {
		currentGroup.forEach((itemId, index) => {
			result[itemId] = {
				groupLength: currentGroup.length,
				groupPosition: index
			};
		});
	}

	return result;
}
