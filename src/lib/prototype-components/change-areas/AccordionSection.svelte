<script>
	import OptionsBlock from '$lib/prototype-components/change-areas/OptionsBlock.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import Select from '$lib/prototype-components/modified-svelte-components/Select.svelte';
	import AccordionInner from './AccordionInner.svelte';

	export let accordionSection, accordionOpen, index, chosen, visibleAreas, customLookup;

	const onClickEventOpen = () => {
		accordionOpen = index === accordionOpen ? null : index;
	};

	$: unaccordionedOptions = accordionSection.options.filter(
		(el) => ('include' in el ? el.include : true) && !el.accordion && el.data.length > 0
	);

	$: accordionedOptions = accordionSection.options.filter(
		(el) => ('include' in el ? el.include : true) && el.accordion && el.data.length > 0
	);

	let searchText = '';

	$: regex = searchText ? new RegExp(searchText, 'i') : null;

	let isSearchTextFilled = false;
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
				<Select bind:searchText bind:isSearchTextFilled></Select>
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
	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: flex-start;
		gap: 4px;
	}

	.accordion-button {
		padding: 4px 0px;
		margin: 0px;
		background-color: transparent;
		border-style: none;
		text-underline-offset: 3px;
		align-items: center;
	}

	.accordion-button:hover {
		text-decoration: underline;
	}

	.accordion-button span {
		font-weight: bold;
		padding: 0px 4px 0px 0px;
		flex: 0 0 auto;
	}

	.options-container {
		/* margin: 10px 20px; */
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

	.visible-areas-container {
		margin: 5px 0px;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		flex: 1;
	}
</style>
