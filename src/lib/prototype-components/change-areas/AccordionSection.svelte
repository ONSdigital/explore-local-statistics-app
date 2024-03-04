<script>
	import OptionsBlock from '$lib/prototype-components/change-areas/OptionsBlock.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import Select from '$lib/prototype-components/modified-svelte-components/Select.svelte';
	import AreaPanel from '$lib/prototype-components/AreaPanel.svelte';

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

<div class="accordion-section-container">
	<div class="row-container">
		{#if accordionSection.accordion}
			<button class="accordion-button row-container" on:click={onClickEventOpen}>
				<svg width="30" height="30" viewBox="0 0 24 24">
					<g transform={accordionOpen === index ? 'translate(24,0)rotate(90)' : null}>
						<path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
					</g>
				</svg>
				<span>{accordionSection.label}</span>
			</button>
		{:else}
			<span style="font-weight: bold;">{accordionSection.label}</span>
		{/if}

		<div class="visible-areas-container">
			{#each Array.isArray(visibleAreas) ? (visibleAreas.length > 0 ? visibleAreas : [null]) : [visibleAreas] as area}
				<AreaPanel
					{area}
					bind:chosen
					{customLookup}
					backgroundColor="color"
					textColor="contrast"
					borderColor="color"
				></AreaPanel>
			{/each}
		</div>
	</div>

	{#if accordionOpen === index || !accordionSection.accordion}
		<div class="options-container">
			{#each unaccordionedOptions as option, i}
				<div class="options-container">
					<OptionsBlock {accordionSection} {option} bind:chosen></OptionsBlock>
				</div>

				<Divider orientation="horizontal"></Divider>
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
		</div>
	{/if}
</div>

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
		margin: 10px 20px;
		display: flex;
		flex-direction: column;
		background-color: #fafafa;
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
		background-color: #fafafa;
	}

	.visible-areas-container {
		margin: 5px 0px;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		flex: 1;
	}
</style>
