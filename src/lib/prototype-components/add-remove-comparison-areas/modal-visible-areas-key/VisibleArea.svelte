<script>
	import { colorsLookup } from '$lib/config';

	export let area;
	export let chosenParentAreasArray,
		chosenSameRegionArray,
		chosenCountriesArray,
		chosenRegionsArray,
		chosenAllOtherArray;

	const onClickEvent = () => {
		chosenParentAreasArray = chosenParentAreasArray.filter((el) => el != area.areacd);
		chosenSameRegionArray = chosenSameRegionArray.filter((el) => el != area.areacd);
		chosenCountriesArray = chosenCountriesArray.filter((el) => el != area.areacd);
		chosenRegionsArray = chosenRegionsArray.filter((el) => el != area.areacd);
		chosenAllOtherArray = chosenAllOtherArray.filter((el) => el != area.areacd);
	};

	$: backgroundColor = colorsLookup[area.role].color;
	$: textColor = colorsLookup[area.role].contrast;
</script>

<button
	on:click={onClickEvent}
	class="visible-area-container"
	style="background-color: {backgroundColor}"
>
	<span style="color: {textColor}">{area.areanm}</span>

	<svg
		cursor="pointer"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		viewBox="0 0 36 24"
		width="20"
		><path stroke={textColor} fill="none" stroke-width="3px" d="M 1 1 l22 22 M23 1 l-22 22"
		></path></svg
	>
</button>

<style>
	button {
		border-radius: 2px;
		text-align: justify;
		font-family: inherit;
		border: none;
		background: none;
	}

	.visible-area-container {
		margin: 2px 5px;
		padding: 5px 5px;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		gap: 15px;
		align-items: center;
	}
</style>
