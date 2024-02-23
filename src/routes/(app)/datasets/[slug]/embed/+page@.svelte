<script lang="ts">
	//@ts-nocheck
	import { Embed, Container, Dropdown, Table } from '@onsvisual/svelte-components';
	import { pivotData, makeMapData } from '$lib/util/datasets/datasetsHelpers';
	import { afterNavigate } from '$app/navigation';
	import Map from '$lib/viz/Map.svelte';

	export let data;

	let geoGroup, year, columns;
	let pivotedData, mapData;
	let selected = [];

	const getUnit = (ind) => (ind.unit && ind.unit !== 'NA' ? ind.unit : ind.subText);
	const doSelect = (e) => {
		const area = e.detail?.area;
		if (selected.map((s) => s.areacd).includes(area.areacd))
			selected = selected.filter((s) => s.areacd !== area.areacd);
		else if (selected.length < 5) selected = [...selected, area];
	};
	const refreshData = () => {
		pivotedData = geoGroup?.codes ? pivotData(data.chartData, geoGroup?.codes) : [];
		mapData =
			geoGroup?.codes && year
				? makeMapData(data.chartData, geoGroup?.codes, year)
				: { data: [], breaks: [] };
	};

	afterNavigate(() => {
		geoGroup = data.indicator.inferredGeos.groups[data.indicator.inferredGeos.groups.length - 1];
		year = data.indicator.years[data.indicator.years.length - 1];
		columns = [
			{ key: 'areacd', label: 'Area code', sortable: true },
			{ key: 'areanm', label: 'Area name', sortable: true },
			...data.indicator.years.map((y) => ({ key: y, label: y, sortable: true }))
		];
		refreshData();
	});
</script>

<Embed>
	<Container width="medium">
		<h3 class="content-subhead">
			{data.indicator.metadata.label}<span>, {getUnit(data.indicator.metadata)}</span>
		</h3>
		{#if mapData && pivotedData}
			{#if data.chartType === 'map'}
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						options={data.indicator.inferredGeos.groups}
						bind:value={geoGroup}
						on:change={refreshData}
					/>
					<Dropdown
						id="year"
						options={data.indicator.years}
						width={10}
						bind:value={year}
						on:change={refreshData}
					/>
				</div>
				<Map
					data={mapData.data}
					breaks={mapData.breaks}
					geos={data.indicator.inferredGeos}
					unit={getUnit(data.indicator.metadata)}
					dp={+data.indicator.metadata.decimalPlaces}
					{selected}
					on:select={doSelect}
				/>
			{:else if data.chartType === 'table'}
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						options={data.indicator.inferredGeos.groups}
						bind:value={geoGroup}
						on:change={refreshData}
					/>
				</div>
				<Table data={pivotedData} {columns} height={500} stickyHeader compact />
			{/if}
		{/if}
	</Container>
</Embed>

<style>
	:global(.ons-field) {
		margin: 0 4px 8px 0 !important;
	}
	.content-dropdowns :global(.ons-field) {
		display: inline-block;
	}
	:global(select.ons-input--select) {
		max-width: 280px !important;
	}
	:global(select#year) {
		width: 90px !important;
	}
	h3.content-subhead {
		font-size: 18px;
		margin-bottom: 8px;
	}
	h3.content-subhead > span {
		font-size: 16px;
		font-weight: normal;
	}
</style>
