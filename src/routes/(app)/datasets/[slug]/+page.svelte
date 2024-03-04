<script lang="ts">
	//@ts-nocheck
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import {
		Breadcrumb,
		Titleblock,
		NavSections,
		NavSection,
		Dropdown,
		Table
	} from '@onsvisual/svelte-components';
	import { pivotData, makeMapData } from '$lib/util/datasets/datasetsHelpers';
	import Lede from '$lib/components/Lede.svelte';
	// import Indicators from '$lib/components/Indicators.svelte';
	import ContentBlock from '$lib/components/ContentBlock.svelte';
	import Map from '$lib/viz/Map.svelte';

	export let data;

	let geoGroup, year, columns;
	let pivotedData, mapData;
	let selected = [];

	const maxSelection = 10;

	const getUnit = (ind) => ind.subText || ind.suffix || ind.prefix;
	const doSelect = (e) => {
		const area = e.detail?.area;
		if (selected.map((s) => s.areacd).includes(area.areacd))
			selected = selected.filter((s) => s.areacd !== area.areacd);
		else if (selected.length < maxSelection) selected = [...selected, area];
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

<Breadcrumb
	links={[
		{ label: 'Home', href: '/', refresh: true },
		{ label: 'Explore local statistics', href: `${base}/` },
		{ label: 'Find a local dataset', href: `${base}/datasets` },
		{ label: data.indicator.metadata.label }
	]}
	background="#eaeaea"
/>
<Titleblock
	title={data.indicator.metadata.label}
	meta={[
		{
			key: 'Data source',
			value: 'Organisation name'
		},
		{
			key: 'Last updated',
			value: 'DD MMM YYYY'
		}
	]}
	background="#eaeaea"
>
	<Lede marginBottom>
		{data.indicator.metadata.subtitle}.
	</Lede>
</Titleblock>

<!-- <Indicators
	topics={data.metadata.topicsArray}
	title="Find another dataset"
	theme="dark"
	background="#003c57"
	hideTitle={false}
	hideToggle={false}
	compact
/> -->

{#if mapData && pivotedData}
	<NavSections contentsLabel="Explore this dataset" marginTop>
		<NavSection title="Map">
			<ContentBlock
				type="map"
				title={data.indicator.metadata.label}
				unit={getUnit(data.indicator.metadata)}
				data={mapData.data}
			>
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
					prefix={data.indicator.metadata.prefix}
					suffix={data.indicator.metadata.suffix}
					dp={+data.indicator.metadata.decimalPlaces}
					{selected}
					on:select={doSelect}
				/>
			</ContentBlock>
		</NavSection>
		<!-- <NavSection title="Beeswarm">
    <ContentBlock type="chart" title={data.indicator.label} unit={getUnit(data.indicator)} data={mapData.data}>
      <div class="content-dropdowns" data-html2canvas-ignore>
        <Dropdown options={data.geos.groups} bind:value={geoGroup} on:change={refreshData}/>
        <Dropdown id="year" options={data.years} bind:value={year} on:change={refreshData}/>
      </div>
      {#key mapData}
      <ScatterChart data={mapData.data} xKey="value" idKey="areacd" labelKey="areanm" color="lightgrey" colorSelect="#206095" height={500} yFitBeeswarm overlayFill hover labels select {selected} on:select={doSelect}/>
      {/key}
    </ContentBlock>
  </NavSection>
  <NavSection title="Timeseries">
    <ContentBlock type="chart" title={data.indicator.label} unit={getUnit(data.indicator)} data={pivotedData}>
      {#if data.years.length > 1}
        <div class="content-dropdowns" data-html2canvas-ignore>
          <Dropdown options={data.geos.groups} bind:value={geoGroup} on:change={refreshData}/>
        </div>
        {#key filteredData}
        <LineChart data={filteredData} xKey="year" yKey="value" zKey="areacd" idKey="areacd" labelKey="areanm" color={pivotedData.length > 40 ? 'rgba(0,0,0,.1)' : 'rgba(0,0,0,.4)'} lineWidth={0.5} height={500} padding={{ top: 20, bottom: 28, left: 35, right: 100 }} yMin={null} hover labels select {selected} on:select={doSelect}/>
        {/key}
      {:else}
        <p>Only one year of data is available for this dataset, therefore no timeseries can be displayed.</p>
      {/if}
    </ContentBlock>
  </NavSection> -->
		<NavSection title="Table">
			<ContentBlock
				type="table"
				title={data.indicator.metadata.label}
				unit={getUnit(data.indicator.metadata)}
				data={pivotedData}
			>
				<div class="content-dropdowns" data-html2canvas-ignore>
					<Dropdown
						options={data.indicator.inferredGeos.groups}
						bind:value={geoGroup}
						on:change={refreshData}
					/>
				</div>
				{#key pivotedData}
					<Table data={pivotedData} {columns} height={500} stickyHeader compact />
				{/key}
			</ContentBlock>
		</NavSection>
		<NavSection title="Get the data">
			<p>
				This dataset was produced by the Office for National Statistics. The original source data
				can be <a href="#0">found here</a>.
			</p>
			<p>
				If you would like a CSV of the data displayed in one of the above charts, you can click the
				"download data" link immediately below it.
			</p>
		</NavSection>
	</NavSections>
{/if}

<style>
	:global(div.ons-grid__col > section:first-of-type > h2) {
		margin-top: 0 !important;
	}
	:global(.ons-field) {
		margin: 0 4px 8px 0 !important;
	}
	.content-dropdowns :global(.ons-field) {
		display: inline-block;
	}
	:global(select.ons-input--select) {
		max-width: 300px !important;
	}
	:global(select#year) {
		width: 90px !important;
	}
	:global(section#map > h2) {
		margin-top: -6px !important;
	}
</style>
