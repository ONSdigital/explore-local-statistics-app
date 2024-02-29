<script lang="ts">
	import Radio from '$lib/prototype-components/modified-svelte-components/Radio.svelte';
	import Checkbox from '$lib/prototype-components/modified-svelte-components/Checkbox.svelte';

	export let accordionSection, option, chosen, regex;

	let accordionOpen = false;

	const onClickEventOpen = () => {
		accordionOpen = !accordionOpen;
	};

	$: labelKey = 'labelKey' in option ? option.labelKey : 'areanm';
	$: idKey = 'idKey' in option ? option.idKey : 'areacd';

	$: optionsArray = option.data.filter((el) => (!regex ? true : regex.test(el[labelKey])));
</script>

{#if optionsArray.length > 0}
	{#if option.accordion}
		<button class="row-container accordion-button" on:click={onClickEventOpen}>
			<svg width="20" height="20" viewBox="0 0 24 24">
				<g transform={accordionOpen ? 'translate(24,0)rotate(90)' : null}>
					<path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
				</g>
			</svg>
			<span>{option.label}</span>
		</button>
	{:else if 'label' in option}
		<span>{option.label}</span>
	{/if}

	{#if !option.accordion || accordionOpen || regex}
		<div class="column-container">
			{#if accordionSection.type === 'radio'}
				<Radio
					{optionsArray}
					bind:valueId={chosen}
					{labelKey}
					{idKey}
					columns={option.data.length > 10 ? 2 : 1}
				></Radio>
			{:else if accordionSection.type === 'checkbox'}
				<Checkbox
					{optionsArray}
					bind:valueArray={chosen}
					{labelKey}
					{idKey}
					columns={option.data.length > 10 ? 2 : 1}
				></Checkbox>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.column-container {
		margin: 0px 20px;
		display: flex;
		flex-direction: column;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: flex-start;
		gap: 4px;
		align-items: center;
	}
	.accordion-button {
		padding: 8px 0px;
		margin: 0px;
		background-color: transparent;
		border-style: none;
		text-underline-offset: 3px;
	}

	.accordion-button:hover {
		text-decoration: underline;
	}

	.accordion-button span {
		padding: 0px 4px 0px 0px;
	}
</style>
