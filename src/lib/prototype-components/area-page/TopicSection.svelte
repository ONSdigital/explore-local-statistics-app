<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import IndicatorRow from '$lib/prototype-components/area-page/IndicatorRow.svelte';

	export let metadata,
		topic,
		filteredIndicatorsCodes,
		hoverAreaId,
		hoverIndicatorId,
		selectedArea,
		selectionsObject,
		customLookup,
		chartData,
		chosenXDomain,
		showConfidenceIntervals;

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
		<NavSection title={topicUppercase} hideTitle subsection>
			<h2 class="">{topicUppercase}</h2>

			{#each subTopics as subTopic, i}
				<div class="sub-topic-container" style="margin-bottom: 10px;">
					{#if topic.name != subTopic.name}
						<h3 class="sub-topic-header" style="margin-bottom: 20px;">
							{subTopic.name[0].toUpperCase() + subTopic.name.substring(1)}
						</h3>
					{/if}

					<!-- <div class="divider" style="margin-bottom: 20px;"></div> -->

					{#each subTopic.filteredIndicators as indicator, j}
						<!-- <Divider orientation="horizontal" margin={[0, 0, 0, 0]}></Divider> -->

						<div style="margin-bottom: 20px;">
							<IndicatorRow
								bind:hoverAreaId
								bind:hoverIndicatorId
								{indicator}
								{customLookup}
								{metadata}
								{selectedArea}
								{selectionsObject}
								indicatorChartData={chartData.combinedDataObject[indicator.code].filter(
									(el) => el.value
								)}
								{chosenXDomain}
								{showConfidenceIntervals}
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

						<div class="divider" style="margin-bottom: 20px;"></div>
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
	.divider {
		border-bottom: 1px solid var(--ons-color-grey-15);
	}
</style>
