<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	import Header from '$lib/prototype-components/area-page/indicator-rows/Header.svelte';
	import VisibleAreasKey from '$lib/prototype-components/area-page/indicator-rows/VisibleAreasKey.svelte';
	import IndicatorRow from '$lib/prototype-components/area-page/IndicatorRow.svelte';

	export let topic, combinedSelectableAreaTypesObject, chartData, metadata;
	export let chosenParentAreasArray,
		chosenRelatedAreasArray,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	let topicUppercase = topic.name[0].toUpperCase() + topic.name.substring(1);

	let hoverId, hoverIndicatorId;
</script>

<div class="topic-section-container">
	<NavSection title={topicUppercase}>
		<div class="unsticky">
			<Header
				{metadata}
				{combinedSelectableAreaTypesObject}
				visibleAreasWithData={[
					combinedSelectableAreaTypesObject.visible.primaryAreas,
					combinedSelectableAreaTypesObject.visible.relatedAreas
				]}
				areasCodesForAreasWithData={null}
				bind:chosenParentAreasArray
				bind:chosenRelatedAreasArray
				bind:chosenSameRegionArray
				bind:chosenCountriesArray
				bind:chosenRegionsArray
				bind:chosenAllOtherArray
			></Header>
		</div>
		<div class="sticky">
			<VisibleAreasKey {combinedSelectableAreaTypesObject}></VisibleAreasKey>
		</div>

		{#each topic.subTopics as subTopic, i}
			<div class="sub-topic-container">
				<h2 class="sub-topic-header">
					{subTopic.name[0].toUpperCase() + subTopic.name.substring(1)}
				</h2>

				{#each subTopic.indicators as indicator, j}
					<Divider orientation="horizontal" margin={[0, 0, 0, 0]}></Divider>

					<IndicatorRow
						topRow={i === 0 && j === 0}
						{indicator}
						{metadata}
						filteredChartData={chartData.combinedDataObject[indicator.code].filter(
							(el) => el.value != 'NA'
						)}
						{combinedSelectableAreaTypesObject}
						bind:hoverId
						bind:hoverIndicatorId
					></IndicatorRow>

					{#if j === subTopic.indicators.length - 1}
						<Divider orientation="horizontal" margin={[0, 0, 0, 0]}></Divider>
					{/if}
				{/each}
			</div>
		{/each}
	</NavSection>
</div>

<style>
	.topic-section-container {
		margin: 100px 0px 0px 0px;
	}

	.sub-topic-container {
		padding: 10px 0px 0px 0px;
	}

	.sub-topic-header {
		font-weight: normal;
		padding: 0px;
		margin: 10px 0px 0px 0px;
	}

	.sticky {
		margin: 0px;
		width: 100%;
		background-color: white;
		padding: 15px 0px;
		position: sticky;
		top: 0px;
		z-index: 10;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.selected-area-key {
		background-color: #003c57;
		color: white;
		border-radius: 2px;
		padding: 5px;
		margin: 0px 5px 0px 0px;
	}

	.median-area-key {
		background-color: #f66068;
		color: white;
		border-radius: 2px;
		padding: 5px;
		margin: 0px 5px 0px 0px;
	}
</style>
