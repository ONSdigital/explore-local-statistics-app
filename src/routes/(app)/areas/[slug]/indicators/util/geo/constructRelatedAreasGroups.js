import { capitalizeFirstLetter, formatName, getGeogName } from '$lib/utils.js';

export function constructRelatedAreasGroups(
	selectedArea,
	parentArea,
	sameGeogLevelAreas,
	sameGeogLevelCodes,
	sameParentSameGeogAreas,
	sameParentSameGeogCodes,
	similarAreasForIndicatorRows,
	similarCodesForIndicatorRows,
	regionChildrenAreas,
	regionChildrenCodes,
	upperTierLocalAuthorityChildrenAreas,
	upperTierLocalAuthorityChildrenCodes,
	lowerTierLocalAuthorityChildrenAreas,
	lowerTierLocalAuthorityChildrenCodes
) {
	return {
		'all-siblings': {
			labels: {
				comparison:
					'Average (median) of all ' + getGeogName(selectedArea.geogLevel, false, 'simplified'),
				related: 'All other ' + getGeogName(selectedArea.geogLevel, false, 'simplified')
			},
			areas: sameGeogLevelAreas,
			codes: sameGeogLevelCodes
		},
		'same-parent-siblings': {
			labels: {
				comparison:
					'Average (median) of all ' +
					getGeogName(selectedArea.geogLevel, false, 'simplified') +
					' in ' +
					formatName(parentArea.areanm),
				related:
					'All other ' +
					getGeogName(selectedArea.geogLevel, false, 'simplified') +
					' in ' +
					formatName(parentArea.areanm)
			},
			areas: sameParentSameGeogAreas,
			codes: sameParentSameGeogCodes
		},
		'similar-siblings': {
			labels: {
				comparison:
					'Average (median) of all demographically similar ' +
					getGeogName(selectedArea.geogLevel, false, 'simplified'),
				related:
					'Demographically similar ' + getGeogName(selectedArea.geogLevel, false, 'simplified')
			},
			areas: similarAreasForIndicatorRows,
			codes: similarCodesForIndicatorRows
		},
		'region-children': {
			labels: {
				related: capitalizeFirstLetter(
					getGeogName('region', false, 'full') + ' in ' + formatName(selectedArea.areanm)
				)
			},
			areas: regionChildrenAreas,
			codes: regionChildrenCodes
		},
		'upper-tier-local-authority-children': {
			labels: {
				related: capitalizeFirstLetter(
					getGeogName('upper', false, 'full') + ' in ' + formatName(selectedArea.areanm)
				)
			},
			areas: upperTierLocalAuthorityChildrenAreas,
			codes: upperTierLocalAuthorityChildrenCodes
		},
		'lower-tier-local-authority-children': {
			labels: {
				related: capitalizeFirstLetter(
					getGeogName('lower', false, 'full') + ' in ' + formatName(selectedArea.areanm)
				)
			},
			areas: lowerTierLocalAuthorityChildrenAreas,
			codes: lowerTierLocalAuthorityChildrenCodes
		}
	};
}
