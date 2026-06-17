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
	let selectedGeos = [];
	let selectedIndicators = [];

	$inspect(data);
	let checked = $state(false);
	let value = null;

	function buildPage() {
		pageBuilderData.set({
			primaryGeographies: selectedPrimary,
			geographies: selectedComparison,
			indicators: selectedIndicators
		});
	}
</script>

<Hero width="medium" title="Page builder" cls="titleblock-transparent">
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
				options={data.data.geo
					? Object.entries(data.data.geo).map(([value, obj]) => ({
							label: obj.areanm,
							value
						}))
					: []}
				bind:value
			></Select>
			<Checkbox id="average" label="Calculate average across these geographies" bind:checked compact
			></Checkbox>
		</AccordionItem>

		<AccordionItem title="Comparison geographies">
			<Select
				label="Geography"
				placeholder="Choose one or more"
				options={data.data.geo
					? Object.entries(data.data.geo).map(([value, obj]) => ({
							label: obj.areanm,
							value
						}))
					: []}
			></Select>
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
