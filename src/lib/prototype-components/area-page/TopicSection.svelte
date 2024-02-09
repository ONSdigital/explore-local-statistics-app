<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	import Header from '$lib/prototype-components/area-page/indicator-rows/Header.svelte';
	import VisibleAreasKey from '$lib/prototype-components/area-page/indicator-rows/VisibleAreasKey.svelte';
	import IndicatorRow from '$lib/prototype-components/area-page/IndicatorRow.svelte';

	export let topic, areasGroupsObject, chartData, metadata;
	export let chosenComparisonMeasureOrArea,
		chosenAdditionalComparisonAreasGroup,
		startXDomainNumb,
		endXDomainNumb;

	let topicUppercase = topic.name[0].toUpperCase() + topic.name.substring(1);

	let hoverId, hoverIndicatorId;
</script>

<div class="topic-section-container">
	<NavSection title={topicUppercase}>
		{#each topic.subTopics as subTopic, i}
			<div class="sub-topic-container">
				<h2 class="sub-topic-header">
					{subTopic.name[0].toUpperCase() + subTopic.name.substring(1)}
				</h2>

				{#each subTopic.indicators as indicator, j}
					<Divider orientation="horizontal" margin={[0, 0, 0, 0]}></Divider>

					<div style="background-color: {j % 2 === 0 ? '#fafafa' : 'white'}">
						<IndicatorRow
							topRow={i === 0 && j === 0}
							{indicator}
							{metadata}
							indicatorChartData={chartData.combinedDataObject[indicator.code].filter(
								(el) => el.value != 'NA'
							)}
							{areasGroupsObject}
							bind:hoverId
							bind:hoverIndicatorId
							{chosenComparisonMeasureOrArea}
							{chosenAdditionalComparisonAreasGroup}
							{startXDomainNumb}
							{endXDomainNumb}
						></IndicatorRow>
					</div>

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
		margin: 0px;
	}

	.sub-topic-container {
		padding: 10px 0px 0px 0px;
	}

	.sub-topic-header {
		font-weight: normal;
		padding: 0px;
		margin: 10px 0px 0px 0px;
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
