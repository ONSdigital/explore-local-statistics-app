<script lang="ts">
	import Button from '$lib/prototype-components/modified-svelte-components/button/Button.svelte';
	import Divider from '$lib/prototype-components/layout/Divider.svelte';
	import Radio from '$lib/prototype-components/modified-svelte-components/Radio.svelte';

	export let metadata, startXDomainNumb, endXDomainNumb;

	let showTimePeriodModal = false;

	let dialog; // HTMLDialogElement

	$: if (dialog && showTimePeriodModal) dialog.showModal();

	const onClickEventOpen = () => {
		showTimePeriodModal = true;
	};

	$: timePeriodOptionsArray = Array.from(
		{ length: metadata.globalXDomainExtent[1] - metadata.globalXDomainExtent[0] + 1 },
		(_, index) => metadata.globalXDomainExtent[0] + index
	);

	$: console.log(timePeriodOptionsArray);
</script>

<div class="button-container">
	<Button
		on:click={onClickEventOpen}
		small={true}
		icon="circle"
		variant="secondary"
		strokeWidth="5.5px"
		stroke="currentcolor"
		fill="none">Adjust time period</Button
	>
</div>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
{#if showTimePeriodModal}
	<dialog
		bind:this={dialog}
		on:close={() => (showTimePeriodModal = false)}
		on:click|self={() => dialog.close()}
	>
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div on:click|stopPropagation>
			<div class="add-comparison-areas-container">
				<div class="row-container title-exit-button-container">
					<p class="modal-title">Set time periods</p>

					<Button
						on:click={() => dialog.close()}
						small={true}
						icon="cross"
						variant="secondary"
						stroke="currentcolor"
						fill="none"
						strokeWidth="2.5px"
					></Button>
				</div>
			</div>
			<Divider orientation="horizontal" margin={[10, 0, 10, 0]}></Divider>

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
								isNaN(startXDomainNumb)
									? el > metadata.globalXDomainExtent[0]
									: el > startXDomainNumb
							)
						]}
						bind:valueId={endXDomainNumb}
						labelKey={null}
						idKey={null}
					></Radio>
				</div>
			</div>
		</div>
	</dialog>
{/if}

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
