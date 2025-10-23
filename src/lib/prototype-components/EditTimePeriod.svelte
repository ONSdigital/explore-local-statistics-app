<script lang="ts">
	import Slider from '$lib/components/Slider.svelte';
	import debounce from 'debounce';

	export let metadata,
		chosenXDomainNumbStart,
		chosenXDomainNumbEnd,
		timePeriodsArray,
		chosenTimePeriodDropdownLabel,
		includeNotes;

	// $: timePeriodOptionsArray = Array.from(
	// 	{ length: metadata.globalXDomainExtent[1] - metadata.globalXDomainExtent[0] + 1 },
	// 	(_, index) => metadata.globalXDomainExtent[0] + index
	// );

	function setChosenXDomain(e) {
		let min = Math.min(...e.detail);
		let max = Math.max(...e.detail);
		// if (min === max) {
		// 	if (min === metadata.globalXDomainExtent[0]) max += 1;
		// 	else min -= 1;
		// }
		chosenXDomainNumbStart = min;
		chosenXDomainNumbEnd = max;

		if (chosenTimePeriodDropdownLabel) {
			chosenTimePeriodDropdownLabel = timePeriodsArray.find((el) => el.xDomainNumb === max).label;
		}
	}

	let isDecimal = timePeriodsArray.some((n) => n.xDomainNumb % 1 !== 0);

	// $: console.log(timePeriodsArray);
</script>

<Slider
	value={[chosenXDomainNumbStart, chosenXDomainNumbEnd]}
	min={timePeriodsArray
		? timePeriodsArray[timePeriodsArray.length - 1].xDomainNumb
		: metadata.globalXDomainExtent[0]}
	max={timePeriodsArray ? timePeriodsArray[0].xDomainNumb : metadata.globalXDomainExtent[1]}
	step={isDecimal ? 0.25 : 1}
	on:input={debounce(setChosenXDomain, 100)}
	{timePeriodsArray}
/>
{#if includeNotes}
	<span class="small-note"
		>Note: Charts will show the earliest/latest available dates within this range.</span
	>
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
	span.small-note {
		font-size: 16px;
	}
</style>
