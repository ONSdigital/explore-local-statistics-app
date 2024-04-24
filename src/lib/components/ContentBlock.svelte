<script lang="ts">
	//@ts-nocheck
	import ContentActions from './ContentActions.svelte';

	export let embedProps = {};
	export let title = null;
	export let metadata = null;
	export let indicator = null;
	export let type = embedProps?.type || 'chart';
	export let data = null;
	export let showActions = true;
	export let unit = false;

	let el;

	$: sourceOrgs = indicator ? indicator.metadata.sourceOrg.split('|') : [];
	$: sourceLinks = indicator ? indicator.metadata.sourceURL.split('|') : [];
</script>

<div class="content-block-wrapper" class:border-rounded={!showActions}>
	<div class="content-block" class:hide-actions={!showActions} bind:this={el}>
		{#if title}
			<span class="content-subhead">
				<h3>{title}</h3>
				{#if unit}
					<span>{unit ? `, ${unit}` : ''}</span>
				{/if}
				<!-- <span>{unit ? `, ${unit}` : ''}</span> -->
			</span>
		{/if}
		<slot />
		{#if sourceOrgs.length > 0}
			<div class="source-notes-container">
				<p class="source-container">
					<span style="font-weight: bold">Source:</span>
					{#each sourceOrgs as org, i}
						<a href={sourceLinks[i]} target="_blank">{org}</a>
						{#if i < sourceOrgs.length - 2}
							,
						{:else if i === sourceOrgs.length - 2}
							{'and '}
						{/if}
					{/each}
				</p>
			</div>
		{/if}
	</div>
</div>
{#if showActions}
	<ContentActions {el} {embedProps} {title} {metadata} {indicator} {type} {data} />
{/if}

<style>
	.content-block-wrapper {
		border: 1px solid #222;
		border-top-left-radius: 4px;
		border-top-right-radius: 4px;
	}
	.border-rounded {
		border-radius: 4px;
	}
	.content-block {
		padding: 12px;
	}
	.hide-actions {
		border-bottom-left-radius: 4px;
		border-bottom-right-radius: 4px;
	}
	h3.content-subhead {
		font-size: 1.222em;
		margin: 0;
	}
	h3.content-subhead > span {
		font-size: 16px;
		font-weight: normal;
	}
	.source-notes-container {
		padding: 8px 0 4px;
		font-size: 16px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.source-container {
		padding: 0px;
		margin: 0px;
		line-height: 1;
	}

	.content-subhead {
		margin: 0;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: baseline;
	}

	h3 {
		margin: 0px;
	}
</style>
