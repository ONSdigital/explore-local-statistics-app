<script>
	import OptionsBlock from './OptionsBlock.svelte';
	import Select from '$lib/modified-library-components/Select.svelte';
	import Divider from '$lib/layout/Divider.svelte';
	import AccordionInner from './AccordionInner.svelte';

	export let accordionSection, accordionOpen, index, chosen;

	const onClickEventOpen = () => {
		accordionOpen = index === accordionOpen ? null : index;
	};

	//splits the section into accordioned and unaccordioned (e.g. always visible) options - unaccordioned options are always rendered above the accordions
	$: unaccordionedOptions = accordionSection.options.filter(
		(el) => ('include' in el ? el.include : true) && !el.accordion && el.data.length > 0
	);
	$: accordionedOptions = accordionSection.options.filter(
		(el) => ('include' in el ? el.include : true) && el.accordion && el.data.length > 0
	);

	// tracks inputted text in the search box
	let searchText = '';
	$: regex = searchText ? new RegExp(searchText, 'i') : null;
	let isSearchTextFilled = false;

	// Generate a label based on the accordion section
	$: searchLabel = `Find ${accordionSection.label.toLowerCase()}`;
	$: searchPlaceholder = `Type to filter ${accordionSection.label.toLowerCase()}`;
</script>

<AccordionInner title={accordionSection.label}>
	{#each unaccordionedOptions as option, i}
		<div class="options-container">
			<OptionsBlock {accordionSection} {option} bind:chosen></OptionsBlock>
		</div>

		<Divider orientation="horizontal" margin={[8, 0]}></Divider>
	{/each}

	{#if accordionedOptions.length > 0}
		<div class="sticky-container">
			<div class="sticky">
				<Select
					bind:searchText
					bind:isSearchTextFilled
					label={searchLabel}
					placeholder={searchPlaceholder}
				></Select>
			</div>

			{#each accordionedOptions as option, i}
				<div class="options-container">
					<OptionsBlock {accordionSection} {option} bind:chosen {regex}></OptionsBlock>
				</div>
			{/each}
		</div>
	{/if}
</AccordionInner>

<style>
	.options-container {
		display: flex;
		flex-direction: column;
		border-radius: 2px;
	}

	.sticky-container {
		max-height: 300px;
		overflow: auto;
	}

	.sticky {
		padding: 5px 0px;
		position: sticky;
		top: 0px;
		background: white;
		z-index: 1;
	}
</style>
