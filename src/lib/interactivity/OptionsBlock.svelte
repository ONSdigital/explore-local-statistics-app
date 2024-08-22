<script lang="ts">
	import Radio from '$lib/modified-library-components/Radio.svelte';
	import Checkbox from '$lib/modified-library-components/Checkbox.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { slugify } from '$lib/util/url/slugify';

	export let accordionSection, option, chosen, regex;

	let accordionOpen = false;

	const onClickEventOpen = () => {
		accordionOpen = !accordionOpen;
	};

	$: {
		accordionOpen = regex;
	}

	$: labelKey = 'labelKey' in option ? option.labelKey : 'areanm';
	$: idKey = 'idKey' in option ? option.idKey : 'areacd';

	$: optionsArray = option.data.filter((el) => (!regex ? true : regex.test(el[labelKey])));
	$: if (option.accordion) console.log(slugify(option?.label));
</script>

{#if optionsArray.length > 0}
	{#if option.accordion}
		<button
			class="row-container accordion-button"
			aria-expanded={accordionOpen}
			aria-controls={'column-container-' + slugify(option?.label)}
			on:click={onClickEventOpen}
		>
			<Icon type="chevron" rotation={accordionOpen ? -90 : 0} />
			<span>{option.label}</span>
		</button>
	{:else if 'label' in option}
		<span>{option.label}</span>
	{/if}

	{#if !option.accordion || accordionOpen}
		<div
			class="column-container"
			id={accordionOpen ? 'column-container-' + slugify(option?.label) : ''}
		>
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
		margin: 0 3px;
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

	button.accordion-button > span {
		display: inline-block;
		transform: translateY(2px);
	}
</style>
