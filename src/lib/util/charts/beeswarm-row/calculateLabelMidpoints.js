export function calculateLabelMidpoints(
	comparisonX,
	selectedAreaX,
	comparisonLabelWidth,
	selectedAreaLabelWidth,
	chartWidth,
	spaceForOutliers
) {
	if (
		(!comparisonLabelWidth && !selectedAreaLabelWidth) ||
		(comparisonLabelWidth === 0 && selectedAreaLabelWidth === 0)
	) {
		return { comparison: 0, selectedArea: 0 };
	}

	let boundedComparisonX = Math.min(
		Math.max(comparisonLabelWidth / 2 - spaceForOutliers / 2, comparisonX),
		chartWidth + spaceForOutliers / 2 - comparisonLabelWidth / 2
	);

	let boundedSelectedAreaX = Math.min(
		Math.max(selectedAreaLabelWidth / 2 - spaceForOutliers / 2, selectedAreaX),
		chartWidth + spaceForOutliers / 2 - selectedAreaLabelWidth / 2
	);

	if (!comparisonX) {
		return { comparison: 0, selectedArea: boundedSelectedAreaX };
	} else if (!selectedAreaX) {
		return { comparison: boundedComparisonX, selectedArea: 0 };
	} else if (
		(boundedComparisonX - comparisonLabelWidth / 2 <=
			boundedSelectedAreaX + selectedAreaLabelWidth / 2 &&
			boundedComparisonX + comparisonLabelWidth / 2 >=
				boundedSelectedAreaX - selectedAreaLabelWidth / 2) ||
		(boundedSelectedAreaX - selectedAreaLabelWidth / 2 <=
			boundedComparisonX + comparisonLabelWidth / 2 &&
			boundedSelectedAreaX + selectedAreaLabelWidth / 2 >=
				boundedComparisonX - comparisonLabelWidth / 2)
	) {
		if (
			selectedAreaX <= comparisonX &&
			boundedComparisonX - comparisonLabelWidth / 2 - selectedAreaLabelWidth < -spaceForOutliers / 2
		) {
			return {
				comparison: selectedAreaLabelWidth - spaceForOutliers / 2 + comparisonLabelWidth / 2,
				selectedArea: selectedAreaLabelWidth / 2 - spaceForOutliers / 2
			};
		} else if (
			selectedAreaX >= comparisonX &&
			boundedComparisonX + comparisonLabelWidth / 2 + selectedAreaLabelWidth >
				chartWidth + spaceForOutliers / 2
		) {
			return {
				comparison:
					chartWidth + spaceForOutliers / 2 - selectedAreaLabelWidth - comparisonLabelWidth / 2,
				selectedArea: chartWidth + spaceForOutliers / 2 - selectedAreaLabelWidth / 2
			};
		} else {
			if (boundedSelectedAreaX < boundedComparisonX) {
				return {
					comparison: boundedComparisonX,
					selectedArea: boundedComparisonX - comparisonLabelWidth / 2 - selectedAreaLabelWidth / 2
				};
			} else {
				return {
					comparison: boundedComparisonX,
					selectedArea: boundedComparisonX + comparisonLabelWidth / 2 + selectedAreaLabelWidth / 2
				};
			}
		}
	}

	return { comparison: boundedComparisonX, selectedArea: boundedSelectedAreaX };
}
