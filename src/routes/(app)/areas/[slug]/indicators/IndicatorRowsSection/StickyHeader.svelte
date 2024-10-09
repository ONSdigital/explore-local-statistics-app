<script lang="ts">
	import ChangeAreas from '$lib/interactivity/ChangeAreas.svelte';
	import ChartOptions from '$lib/interactivity/ChartOptions.svelte';
	import AreaPanel from '$lib/interactivity/AreaPanel.svelte';

	import { maxAdditionalAreasOnKey } from '../config';

	export let metadata,
		selectedArea,
		accordionArray,
		selectionsObject,
		customLookup,
		chosenXDomainNumbStart,
		chosenXDomainNumbEnd,
		showConfidenceIntervals,
		stickyZIndex,
		toggle;

	//splits additonal areas into parent / uk and others, so that the parent and uk areas always ordered first on the key
	$: visibleParentAreas = selectionsObject['areas-rows-additional-visible'].filter(
		(el) => el.role != 'custom'
	);
	$: visibleCustomAreas = selectionsObject['areas-rows-additional-visible'].filter(
		(el) => el.role === 'custom'
	);

	let innerWindowHeight = window.innerHeight;

	window.addEventListener('resize', () => {
		innerWindowHeight = window.innerHeight;
	});

	let showAllAreas = false;
</script>

<div
	class="row-container sticky control-panel"
	style="z-index: {stickyZIndex}; top: {innerWindowHeight <= 300 ? -130 : 0}px"
>
	<div class="visible-areas-key-container grid-container">
		<AreaPanel
			area={selectedArea}
			markerRadius="8"
			button={false}
			fontWeight="bold"
			{showConfidenceIntervals}
		></AreaPanel>
		{#if !showConfidenceIntervals}
			{#if selectionsObject['areas-rows-comparison-visible']}
				<AreaPanel
					area={selectionsObject['areas-rows-comparison-visible']}
					markerRadius="8"
					button={false}
					fontWeight="bold"
					markerShape="diamond"
				></AreaPanel>
			{/if}
			{#each showAllAreas ? visibleParentAreas : visibleParentAreas.slice(0, maxAdditionalAreasOnKey) as area, i}
				<AreaPanel
					{area}
					markerShape={area.areacd === selectedArea.parentcd ? 'square' : 'diamond'}
					markerRadius="8"
					button={false}
					backgroundColor="white"
					fontWeight="bold"
					{customLookup}
				></AreaPanel>
			{/each}
			{#each showAllAreas ? visibleCustomAreas : visibleCustomAreas.slice(0, Math.max(0, maxAdditionalAreasOnKey - visibleParentAreas.length)) as area, i}
				<AreaPanel
					{area}
					markerRadius="8"
					button={false}
					backgroundColor="white"
					fontWeight="bold"
					{customLookup}
				></AreaPanel>
			{/each}
		{/if}
		{#if selectionsObject['related-rows-visible'] || selectionsObject['areas-rows-additional-visible'].length > 0}
			<AreaPanel
				area={selectionsObject['related-rows-visible']}
				markerRadius="6"
				button={false}
				backgroundColor="white"
				color="#ddd"
				borderColor="#707070"
			></AreaPanel>
			{#if !showConfidenceIntervals}
				{#if !showAllAreas && visibleParentAreas.length + visibleCustomAreas.length > maxAdditionalAreasOnKey}
					<button class="btn-link" on:click={() => (showAllAreas = true)}
						>Show {visibleParentAreas.length + visibleCustomAreas.length - maxAdditionalAreasOnKey} more
						{visibleParentAreas.length + visibleCustomAreas.length - maxAdditionalAreasOnKey === 1
							? 'area'
							: 'areas'}</button
					>
				{:else if showAllAreas}
					<button class="btn-link" on:click={() => (showAllAreas = false)}>Show fewer areas</button>
				{/if}
			{/if}
		{/if}
	</div>

	<div class="buttons-container">
		<ChangeAreas {selectedArea} {accordionArray} bind:selectionsObject {customLookup}></ChangeAreas>

		<ChartOptions
			{metadata}
			bind:showConfidenceIntervals
			bind:chosenXDomainNumbStart
			bind:chosenXDomainNumbEnd
			includeNotes={true}
		></ChartOptions>

		<div class="toggle-container">
			Beeswarm
			<label class="switch">
				<input type="checkbox" bind:checked={toggle} on:change={() => console.log(toggle)} />
				<span class="slider"></span>
			</label>
			Line chart
		</div>
	</div>
</div>

<style>
	.control-panel {
		border-bottom: 1px solid var(--ons-color-grey-15);
	}

	.sticky {
		margin: 0px;
		width: 100%;
		background-color: white;
		padding: 10px 0;
		position: sticky;
		top: 0px;
		/* z-index: 10; */
		display: flex;
		flex-direction: column;
		gap: 10px;
		justify-content: space-between;
	}

	.sticky:hover {
		top: 0px !important;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 10px;
	}

	.grid-container {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		min-width: 200px;
	}

	.buttons-container {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 4px;
	}

	.btn-link {
		text-align: left;
		font-size: 16px;
		padding-left: 24px;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 60px;
		height: 34px;
		z-index: 1;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #206095;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 34px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 26px;
		width: 26px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:focus + .slider {
		box-shadow: 0 0 0 6px #fbc900;
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(26px);
		-ms-transform: translateX(26px);
		transform: translateX(26px);
	}

	.toggle-container {
		display: block;
	}
</style>
