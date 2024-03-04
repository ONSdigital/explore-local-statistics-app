<script lang="ts">
	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Modal from '$lib/prototype-components/layout/Modal.svelte';
	import EditTimePeriod from '$lib/prototype-components/EditTimePeriod.svelte';
	import Radio from '$lib/prototype-components/modified-svelte-components/Radio.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';

	export let metadata, startXDomainNumb, endXDomainNumb, showConfidenceIntervals;

	let showModal = false;

	const onClickEventOpen = () => {
		showModal = true;
	};

	let accordionOpen = null;
</script>

<div class="button-container">
	<Button
		on:click={onClickEventOpen}
		small={true}
		icon="settings"
		variant="secondary"
		strokeWidth="1.5px"
		stroke="currentcolor"
		fill="none"
	></Button>
</div>

<Modal bind:showModal bind:accordionOpen>
	<div class="title-container row-container" slot="title">
		<span style="font-weight: bold">Chart options</span>
	</div>

	<div slot="content" class="column-container">
		<Radio
			title="Show confidence intervals"
			optionsArray={[
				{ label: 'No', id: false },
				{ label: 'Yes', id: true }
			]}
			bind:valueId={showConfidenceIntervals}
			labelKey="label"
			idKey="id"
		></Radio>

		<Divider orientation="horizontal"></Divider>

		<EditTimePeriod {metadata} bind:startXDomainNumb bind:endXDomainNumb></EditTimePeriod>
	</div>
</Modal>

<style>
	.title-container span {
		font-weight: bold;
		font-size: 20px;
	}

	.row-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: flex-start;
		gap: 5px;
		align-items: center;
	}

	.column-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
