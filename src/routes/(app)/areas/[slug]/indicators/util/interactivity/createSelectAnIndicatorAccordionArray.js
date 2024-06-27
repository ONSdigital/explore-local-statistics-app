import { formatName } from '$lib/utils.js';

export function createSelectAnIndicatorAccordionArray(
	selectedArea,
	parentArea,
	changeAreasOptionsObject,
	selectionsObject
) {
	return [
		{
			label: 'Related area group',
			type: 'radio',
			search: null,
			chosenKey: 'related-single',
			accordion: true,
			options: [
				{
					data: changeAreasOptionsObject.related,
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				},
				{
					data: [{ label: 'None', key: 'none' }],
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				}
			]
		},
		{
			label: 'Additional areas',
			type: 'checkbox',
			chosenKey: 'areas-single-additional',
			accordion: true,
			options: [
				{
					data: changeAreasOptionsObject.parents,
					accordion: false
				},
				{
					label: 'Other areas in ' + formatName(parentArea.areanm),
					data: changeAreasOptionsObject.sameParent,
					accordion: true,
					include: ['lower', 'upper'].includes(selectedArea.geogLevel)
				},
				{
					label: 'Countries',
					data: changeAreasOptionsObject.country,
					accordion: true
				},
				{ label: 'Regions', data: changeAreasOptionsObject.region, accordion: true },
				{
					label: 'Combined authorities',
					data: changeAreasOptionsObject.combined,
					accordion: true
				},
				{
					label: 'Upper-tier/unitary authorities',
					data: changeAreasOptionsObject.upper,
					accordion: true
				},
				{
					label: 'Lower-tier/unitary authorities',
					data: changeAreasOptionsObject.lower,
					accordion: true
				}
			]
		}
	];
}
