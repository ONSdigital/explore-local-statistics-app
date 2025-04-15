<script lang="ts">
	//@ts-nocheck
	import { page } from '$app/stores';
	import { downloadCSV, downloadPNG, clip } from '$lib/util/charts/chartActions';
	import { Textarea, Button, analyticsEvent } from '@onsvisual/svelte-components';
	import Icon from './Icon.svelte';

	export let el = null;
	export let embedUrl = `${$page.url.href}/embed`;
	export let embedProps = {};
	export let title = null;
	export let metadata = null;
	export let indicator = null;
	export let type = embedProps?.type || 'chart';
	export let data = null;

	let showEmbed = false;

	$: embedCode = `<div id="${type}"></div>
	<scr${''}ipt src="https://cdn.ons.gov.uk/vendor/pym/1.3.2/pym.min.js"></scr${''}ipt>
	<scr${''}ipt>var pymParent = new pym.Parent("${type}-${indicator?.metadata?.slug}", "${embedUrl}?${Object.keys(
		embedProps
	)
		.filter((key) => embedProps[key] && embedProps[key] !== 'none')
		.map((key) => `${key}=${embedProps[key]}`)
		.join(
			'&'
		)}", {name: "${type}-${indicator?.metadata?.slug}", title: "${title}"});</scr${''}ipt>`;
</script>

<div class="content-actions">
	<h4>Use and share</h4>
	<ul>
		{#if type !== 'table'}<li>
				<Icon type="chart" /><span
					><button
						class="btn-link"
						aria-label="Download the {indicator.metadata.label} {type} {type == 'map'
							? ''
							: 'chart'} as a PNG image"
						on:click={() => {
							downloadPNG(el, indicator.metadata.slug, type);
							const eventData = {
								event: 'fileDownload',
								fileExtension: 'png',
								chartType: type,
								indicatorCode: indicator.metadata.slug,
								indicatorName: indicator.metadata.label,
								contentGroup: indicator.topic,
								contentSubgroup: indicator.subTopic
							};
							analyticsEvent(eventData);
						}}>Download {type} {type == 'map' || type == 'table' ? '' : 'chart'} image (PNG)</button
					></span
				>
			</li>{/if}
		{#if data}<li>
				<Icon type="download" /><span
					><button
						class="btn-link"
						aria-label="Download the {indicator.metadata.label} {type} {type == 'map'
							? ''
							: 'chart'} data as a CSV file"
						on:click={() => {
							downloadCSV(data, metadata, indicator, type);
							const eventData = {
								event: 'fileDownload',
								fileExtension: 'csv',
								chartType: type,
								indicatorCode: indicator.metadata.slug,
								indicatorName: indicator.metadata.label,
								contentGroup: indicator.topic,
								contentSubgroup: indicator.subTopic
							};
							analyticsEvent(eventData);
						}}>Download {type} {type == 'map' || type == 'table' ? '' : 'chart'} data (CSV)</button
					></span
				>
			</li>{/if}
		<li>
			<Icon type="code" /><span
				><button
					class="btn-link"
					aria-expanded={showEmbed}
					on:click={() => (showEmbed = !showEmbed)}
					>{showEmbed ? 'Hide embed code' : `Embed code`}</button
				></span
			>
		</li>
	</ul>
	{#if showEmbed}
		<div class="content-embed">
			<Textarea value={embedCode} rows={4} width={30} hideLabel />
			<Button
				small
				on:click={() => {
					clip(embedCode, 'Copied to clipboard!');
					const eventData = {
						event: 'embed',
						chartType: type,
						indicatorCode: indicator.metadata.slug,
						indicatorName: indicator.metadata.label,
						contentGroup: indicator.topic,
						contentSubgroup: indicator.subTopic
					};
					analyticsEvent(eventData);
				}}>Copy to clipboard</Button
			>
		</div>
	{/if}
</div>

<style>
	.content-actions {
		background: var(--pale, #f0f0f0);
		font-size: 16px;
		padding: 6px 8px 12px;
		border-bottom-left-radius: 4px;
		border-bottom-right-radius: 4px;
	}
	.content-actions > h4 {
		margin: 0 0 4px;
		font-size: 16px;
	}
	.content-actions ul {
		margin: 0;
		padding: 0;
	}
	.content-actions ul > li {
		display: inline;
	}
	.content-actions ul > li + li {
		margin-left: 12px;
	}
	.content-actions span {
		display: inline-block;
		transform: translateY(-2px);
		margin-left: 6px;
	}
	.content-embed {
		display: block;
		width: 100%;
	}
	.content-embed :global(textarea) {
		margin-top: 8px;
	}
	button {
		font-family: unset;
	}
	button.btn-link {
		line-height: 1.3;
		color: var(--link, #206095);
		background: none;
		margin: 0;
		padding: 0;
		border: none;
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-position: under;
	}
	button.btn-link:hover {
		color: var(--link-hover, #003c57) !important;
		text-decoration-thickness: 2px;
	}
	button.btn-link:focus {
		background-color: #fbc900 !important;
		box-shadow:
			0 -2px #fbc900,
			0 4px #222;
		color: #222 !important;
		outline: 3px solid transparent;
		outline-offset: 1px;
		text-decoration: none;
	}
</style>
