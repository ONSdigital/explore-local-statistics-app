<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import IndicatorRow from './IndicatorRow.svelte';

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

	$: subTopics = topic.subTopics
		.map((el) => ({
			...el,
			filteredIndicatorCodes: el.indicatorCodes.filter((code) =>
				filteredIndicatorsCodes.includes(code)
			)
		}))
		.filter((el) => el.filteredIndicatorCodes.length > 0);
</script>

{#if subTopics.length > 0}
	<div class="topic-section-container">
		<NavSection title={topicUppercase} hideTitle subsection cls="topic-section">
			<h2>{topicUppercase}</h2>

			{#each subTopics as subTopic}
				<div class="sub-topic-container" style="margin-bottom: 10px;">
					{#if topic.name != subTopic.name}
						<h3 class="sub-topic-header" style="margin-bottom: 20px;">
							{subTopic.name[0].toUpperCase() + subTopic.name.substring(1)}
						</h3>
					{/if}

					{#each subTopic.filteredIndicatorCodes.map((code) => metadata.indicatorsObject[code]) as indicator}
						<div style="margin-bottom: 20px;">
							<IndicatorRow
								bind:hoverAreaId
								bind:hoverIndicatorId
								{indicator}
								{customLookup}
								{metadata}
								{selectedArea}
								{selectionsObject}
								indicatorChartData={chartData.combinedDataObject[indicator.code].filter((el) =>
									el.value == 0 ? el : el.value
								)}
								{chosenXDomain}
								{showConfidenceIntervals}
							></IndicatorRow>
						</div>

						<div class="divider" style="margin-bottom: 20px;"></div>
					{/each}
				</div>
			{/each}
		</NavSection>
	</div>
{/if}

<style>
	:global(#topics > h2) {
		display: none;
	}

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

	:global(section.topic-section) {
		scroll-margin-top: 150px;
	}
</style>
