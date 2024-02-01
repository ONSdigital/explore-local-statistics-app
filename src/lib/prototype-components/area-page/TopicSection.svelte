<script lang="ts">
	import { NavSection } from '@onsvisual/svelte-components';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	export let topic, combinedSelectableAreaTypesObject, chartData, metadata;

	let topicUppercase = topic.name[0].toUpperCase() + topic.name.substring(1);

	let hoverId, hoverIndicatorId;
</script>

<div class="topic-section-container">
	<NavSection title={topicUppercase}>
		<div class="sticky">
			<p>Placeholder for key component</p>
		</div>

		{#each topic.subTopics as subTopic}
			<div class="sub-topic-container">
				<h2 class="sub-topic-header">
					{subTopic.name[0].toUpperCase() + subTopic.name.substring(1)}
				</h2>

				{#each subTopic.indicators as indicator, i}
					<Divider orientation="horizontal"></Divider>

					<p>Placeholder for indicator row</p>

					{#if i === subTopic.indicators.length - 1}
						<Divider orientation="horizontal"></Divider>
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
		padding: 20px 0px 0px 0px;
	}

	.sub-topic-header {
		font-weight: normal;
		padding: 0px;
		margin: 10px 0px 0px 0px;
	}

	.sticky {
		margin: 10px 0px;
		width: 100%;
		background-color: white;
		padding: 15px 0px;
		position: sticky;
		top: 0px;
		z-index: 10;
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
