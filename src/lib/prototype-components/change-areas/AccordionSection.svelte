<script>
	import OptionsBlock from '$lib/prototype-components/change-areas/OptionsBlock.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import Select from '$lib/prototype-components/modified-svelte-components/Select.svelte';
	import AreaPanel from '$lib/prototype-components/change-areas/AreaPanel.svelte';

	export let accordionSection, accordionOpen, index, chosen, visiblePrimaryAreas;

	const onClickEventOpen = () => {
		accordionOpen = index === accordionOpen ? null : index;
	};

	$: accordionedOptions = accordionSection.options.filter(
		(el) => el.accordion && el.data.length > 0
	);

	let searchText = '';

	$: regex = searchText ? new RegExp(searchText, 'i') : null;
</script>

<div class="accordion-section-container">
	<div class="row-container">
		<button class="accordion-button row-container" on:click={onClickEventOpen}>
			<svg width="30" height="30" viewBox="0 0 24 24">
				<g transform={accordionOpen === index ? 'translate(24,0)rotate(90)' : null}>
					<path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
				</g>
			</svg>
			<span>{accordionSection.label}</span>
		</button>

		<div class="visible-areas-container">
			{#if chosen}
				{#each Array.isArray(chosen) ? chosen : [chosen] as areaCode}
					<AreaPanel area={visiblePrimaryAreas.find((el) => el.areacd === areaCode)} bind:chosen
					></AreaPanel>
				{/each}
			{:else}
				<span class="none-selected">None</span>
			{/if}
		</div>
	</div>

	{#if accordionOpen === index}
		<div class="column-container">
			{#each accordionSection.options.filter((el) => !el.accordion && el.data.length > 0) as option, i}
				<div class="options-container">
					<OptionsBlock {accordionSection} {option} bind:chosen></OptionsBlock>
				</div>

				<Divider orientation="horizontal"></Divider>
			{/each}

			{#if accordionedOptions.length > 0}
				<div class="sticky-container">
					<div class="sticky">
						<Select bind:searchText></Select>
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
		align-items: center;
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
	}

	.column-container {
		margin: 10px 20px;
		display: flex;
		flex-direction: column;
	}

	.sticky-container {
		max-height: 300px;
		overflow: auto;
	}

	.sticky {
		padding: 5px 0px;
		position: sticky;
		top: 0px;
		background-color: white;
	}

	.none-selected {
		border-radius: 2px;
		text-align: justify;
		border: none;
		background: #707071;
		color: white;
		line-height: 18px;
		font-size: 18px;
		margin: 0px 5px;
		padding: 3px 5px;
	}
</style>
