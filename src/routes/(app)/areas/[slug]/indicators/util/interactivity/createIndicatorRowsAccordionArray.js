import { formatName } from '$lib/utils.js';

export function createIndicatorRowsAccordionArray(
	selectedArea,
	parentArea,
	changeAreasOptionsObject,
	selectionsObject
) {
	return [
		{
			label: 'Primary comparison area',
			type: 'radio',
			chosenKey: 'areas-rows-comparison',
			accordion: true,
			options: [
				{
					data: changeAreasOptionsObject.median,
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
				},
				{
					data: changeAreasOptionsObject.parents,
					accordion: false
				},
				{
					data: [{ label: 'None', key: 'none' }],
					accordion: false,
					labelKey: 'label',
					idKey: 'key'
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
					accordion: true,
					include: true
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
		},
		{
			label: 'Related area group',
			type: 'radio',
			search: null,
			chosenKey: 'related-rows',
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
			chosenKey: 'areas-rows-additional',
			dependency: 'areas-rows-comparison',
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
			].map((el) => ({
				...el,
				data: el.data.filter(
					(elm) => elm.areacd != selectionsObject['areas-rows-comparison-chosen']
				)
			}))
		}
	];
}
