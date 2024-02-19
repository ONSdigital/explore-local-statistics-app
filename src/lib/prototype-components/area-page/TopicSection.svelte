<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import IndicatorRow from '$lib/prototype-components/area-page/IndicatorRow.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	export let topic,
		areasGroupsObject,
		chartData,
		metadata,
		backgroundAreasCodes,
		filteredIndicatorsCodes;
	export let chosenComparisonMeasureOrArea,
		chosenAdditionalComparisonAreasGroup,
		startXDomainNumb,
		endXDomainNumb;

	let topicUppercase = topic.name[0].toUpperCase() + topic.name.substring(1);

	let hoverId, hoverIndicatorId;

	$: console.log(hoverId, hoverIndicatorId);

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
		<NavSection title={topicUppercase}>
			{#each subTopics as subTopic, i}
				<div class="sub-topic-container">
					<h2 class="sub-topic-header">
						{subTopic.name[0].toUpperCase() + subTopic.name.substring(1)}
					</h2>

					{#each subTopic.filteredIndicators as indicator, j}
						<Divider orientation="horizontal" margin={[0, 0, 0, 0]}></Divider>

						<div style="background-color: {j % 2 === 0 ? '#fafafa' : 'white'}">
							<IndicatorRow
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
							></IndicatorRow>
						</div>

						{#if j === subTopic.filteredIndicators.length - 1}
							<Divider orientation="horizontal" margin={[0, 0, 0, 0]}></Divider>
						{/if}
					{/each}
				</div>
			{/each}
		</NavSection>
	</div>
{/if}

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
</style>
