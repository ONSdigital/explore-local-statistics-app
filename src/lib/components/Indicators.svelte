<script lang="ts">
	//@ts-nocheck
	import { base } from '$app/paths';
	import { beforeNavigate } from '$app/navigation';
	import { capitalise } from '@onsvisual/robo-utils';
	import { Section, Button } from '@onsvisual/svelte-components';
	import Icon from './Icon.svelte';

	export let topics;
	export let compact = false;
	export let title = 'Find a dataset';

	const count = topics
		.map((t) => t.subTopics)
		.flat()
		.map((sub) => sub.indicators)
		.flat().length;

	let open = false;

	beforeNavigate(() => (open = false));
</script>

<Section {title} theme="dark" background="#003c57" width="wide" marginTop>
	{#each topics as topic, i}
		<div class:visuallyhidden={!(open || (!compact && i === 0))}>
			<h3 class="title-indicators">{capitalise(topic.name)}</h3>
			<ul class="list-indicators">
				{#each topic.subTopics
					.map((sub) => sub.indicators)
					.flat()
					.sort((a, b) => a.metadata.label.localeCompare(b.metadata.label)) as ind}
					<li>
						<a href="{base}/datasets/{ind.code}/" class="indicator-link">
							<span>{ind.metadata.label}</span>
							<Icon type="chevron" margin="4px 0 0" />
						</a>
						{ind.metadata.subtitle}
					</li>
				{/each}
			</ul>
		</div>
	{/each}
	<Button variant="ghost" on:click={() => (open = !open)} small>
		{compact && open
			? 'Hide datasets'
			: compact
				? 'Show datasets'
				: open
					? 'Show fewer datasets'
					: `Show all ${count} datasets`}
		<Icon type="chevron" rotation={open ? 90 : -90} />
	</Button>
</Section>

<style>
	h3.title-indicators {
		font-weight: normal;
	}
	ul.list-indicators {
		list-style: none;
		column-width: 250px;
		margin: 4px 0 32px;
		padding: 0;
		overflow-x: none;
		position: relative;
	}
	ul.list-indicators > li {
		font-size: 16px !important;
		margin: 0 0 12px;
		padding: 0 0 14px;
		display: block;
		break-inside: avoid-column;
		border-bottom: 1px solid #809eab;
	}
	a.indicator-link {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		font-size: 18px;
		margin-bottom: 4px;
	}
	a.indicator-link > span {
		font-weight: bold;
	}
</style>
