<script lang="ts">
	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import Radio from '$lib/prototype-components/modified-svelte-components/Radio.svelte';

	export let metadata, startXDomainNumb, endXDomainNumb;

	$: timePeriodOptionsArray = Array.from(
		{ length: metadata.globalXDomainExtent[1] - metadata.globalXDomainExtent[0] + 1 },
		(_, index) => metadata.globalXDomainExtent[0] + index
	);

	$: console.log(timePeriodOptionsArray);
</script>

<div class="row-container">
	<div class="radio-column">
		<Radio
			title={'Select start year:'}
			name="start-year-options"
			optionsArray={[
				'Earliest available data',
				...timePeriodOptionsArray.filter((el) =>
					isNaN(endXDomainNumb) ? el < metadata.globalXDomainExtent[1] : el < endXDomainNumb
				)
			]}
			bind:valueId={startXDomainNumb}
			labelKey={null}
			idKey={null}
		></Radio>
	</div>

	<Divider orientation="vertical" margin={[0, 5, 0, 5]}></Divider>
	<div class="radio-column">
		<Radio
			title={'Select end year:'}
			name="end-year-options"
			optionsArray={[
				'Latest available data',
				...timePeriodOptionsArray.filter((el) =>
					isNaN(startXDomainNumb) ? el > metadata.globalXDomainExtent[0] : el > startXDomainNumb
				)
			]}
			bind:valueId={endXDomainNumb}
			labelKey={null}
			idKey={null}
		></Radio>
	</div>
</div>

<style>
	.button-container {
		margin: 0px 0px 20px 0px;
	}

	dialog {
		width: 760px;
		max-height: 700px;
		border-radius: 5px;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.title-exit-button-container {
		justify-content: space-between;
		align-items: center;
	}

	.row-container {
		margin: 0px 0px 20px 0px;
		padding: 0px;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
	}

	.radio-column {
		flex: 1;
		flex-shrink: 0;
	}

	.modal-title {
		font-weight: bold;
		padding: 0px;
		margin: 0px;
	}
</style>
