<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import IndicatorRow from './IndicatorRow.svelte';

	export let metadata,
		topic,
		filteredIndicatorsCodes,
		hoverAreaId,
		hoverIndicatorId,
		selectedArea,
		selectionsObject,
		chartData,
		startXDomainNumb,
		endXDomainNumb;

	let topicUppercase = topic.name[0].toUpperCase() + topic.name.substring(1);

	$: filteredTopicIndicators = []
		.concat(...topic.subTopics.map((el) => el.indicators))
		.filter((el) => filteredIndicatorsCodes.includes(el.code));

	$: subTopics = topic.subTopics
		.map((el) => ({
			...el,
			filteredIndicators: el.indicators.filter((elm) => filteredIndicatorsCodes.includes(elm.code))
		}))
		.filter((el) => el.filteredIndicators.length > 0);
</script>

{#if filteredTopicIndicators.length > 0}
	<div class="topic-section-container">
		<NavSection title={topicUppercase} subsection>
			{#each subTopics as subTopic, i}
				<div class="sub-topic-container">
					<h2 class="sub-topic-header">
						{subTopic.name[0].toUpperCase() + subTopic.name.substring(1)}
					</h2>

					{#each subTopic.filteredIndicators as indicator, j}
						<Divider orientation="horizontal" margin={[0, 0, 0, 0]}></Divider>

						<div style="background-color: {j % 2 === 0 ? '#fafafa' : 'white'}">
							<IndicatorRow
								bind:hoverAreaId
								bind:hoverIndicatorId
								{indicator}
								{metadata}
								{selectedArea}
								{selectionsObject}
								indicatorChartData={chartData.combinedDataObject[indicator.code].filter(
									(el) => el.value
								)}
								{startXDomainNumb}
								{endXDomainNumb}
							></IndicatorRow>
							<!-- <IndicatorRow
						topRow={i === 0 && j === 0}
						{indicator}
						{metadata}
						indicatorChartData={chartData.combinedDataObject[indicator.code].filter(
							(el) => el.value
						)}
						{areasGroupsObject}
						bind:hoverId
						bind:hoverIndicatorId
						{chosenComparisonMeasureOrArea}
						{chosenAdditionalComparisonAreasGroup}
						{startXDomainNumb}
						{endXDomainNumb}
						{backgroundAreasCodes}
					></IndicatorRow> -->
						</div>
					{/each}
				</div>
			{/each}
		</NavSection>
	</div>
{/if}

<style>
	.sub-topic-header {
		font-weight: normal;
		padding: 0px;
		margin: 10px 0px 0px 0px;
	}

	.topic-section-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
</style>
