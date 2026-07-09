<script lang="ts">
	// @ts-nocheck
	import { resolve } from '$app/paths';
	import { base } from '$app/paths';
	import {
		PhaseBanner,
		Hero,
		Header,
		Breadcrumb,
		Section,
		NavSections,
		NavSection,
		Footer,
		Accordion,
		AccordionItem,
		Select,
		Container,
		Checkbox,
		Button
	} from '@onsvisual/svelte-components';
	import { capitalise } from '@onsvisual/robo-utils';

	let data = $props();
	let checked = $state(false);
	let value = null;

	let pageState = $state({
		selectedAreas: [],
		selectedComparison: [],
		// selectedGeoLevel: data.geoLevels.find((g) => g.id === data.indicator.geography.initialLevel),
		// selectedPeriodRange: [data.periods[0], data.periods[data.periods.length - 1]],
		selectedIndicators: []
	});

	function addArea(area, type = 'primary') {
		type === 'primary'
			? pageState.selectedAreas.push(area)
			: pageState.selectedComparison.push(area);
	}

	function removeArea(area, type = 'primary') {
		const areas = type === 'primary' ? pageState.selectedAreas : pageState.selectedComparison;
		const index = areas.findIndex((d) => d.areacd === area.areacd);
		if (index !== -1) {
			areas.splice(index, 1);
		}
	}

	$inspect(pageState);
	$inspect(data);

	// make it so only one comparison geography selectable
	// change from having all within accordions
	// add ability to choose indicator(?)
	// add select all within parent - include parent as comparison(?)
	// what about ability to add/remove
</script>

<Hero width="medium" title="Custom Page Builder" cls="titleblock-transparent">
	<p class="ons-hero__text">
		Select the geographies and indicators of interest to build a dynamic report.
	</p>
</Hero>

<Container>
	<Accordion>
		<AccordionItem title="Primary geographies">
			<Select
				label="Geography"
				placeholder="Choose one or more"
				autoClear="true"
				options={data.data.geo
					? Object.entries(data.data.geo).map(([value, obj]) => ({
							label: obj.areanm,
							value
						}))
					: []}
				on:change={(e) => addArea(e.detail)}
				bind:value
			></Select>
			{#each pageState.selectedAreas as area, i}
				<Button icon="cross" small on:click={() => removeArea(area)}>{area.label}</Button>
			{/each}
			<Checkbox id="average" label="Calculate average across these geographies" bind:checked compact
			></Checkbox>
		</AccordionItem>

		<AccordionItem title="Comparison geographies">
			<Select
				label="Geography"
				placeholder="Choose a comparison geography"
				options={data.data.geo
					? Object.entries(data.data.geo).map(([value, obj]) => ({
							label: obj.areanm,
							value
						}))
					: []}
				on:change={(e) => addArea(e.detail, 'comparison')}
			></Select>
			{#each pageState.selectedComparison as area, i}
				<Button icon="cross" small on:click={() => removeArea(area, 'comparison')}
					>{area.label}</Button
				>
			{/each}
		</AccordionItem>
		<AccordionItem title="Indicators">
			<Select
				label="Indicators"
				placeholder="Choose one or more indicators"
				options={data.data.taxonomy.data ? data.data.taxonomy.data : []}
			></Select>
		</AccordionItem>
	</Accordion>
	<Button icon="arrow" iconPosition="after" href={resolve(`/pagebuilder/build`)}>Build page</Button>
</Container>
