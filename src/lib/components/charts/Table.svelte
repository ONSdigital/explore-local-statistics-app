<script>
	import { Table } from '@onsvisual/svelte-components';

	let {
		data,
		formatValue = (d) => d,
		formatPeriod = (d) => d,
		selected = null,
		hovered = $bindable(),
		geoLevel = null
	} = $props();

	function pivotData(data) {
		const piv = {};

		for (let i = 0; i < data.areacd.length; i++) {
			const areacd = data.areacd[i];
			if (!piv[areacd]) piv[areacd] = { areacd, areanm: data.areanm[i] };
			piv[areacd][data.period[i]] = data.value[i];
		}
		return Object.values(piv);
	}

	function makeColumns(data) {
		return Object.keys(data[0]).map((key) => ({
			key,
			label: key === 'areacd' ? 'Area code' : key === 'areanm' ? 'Area name' : formatPeriod(key),
			numeric: !['areacd', 'areanm'].includes(key),
			formatter: formatValue
		}));
	}

	let pivotedData = $derived(pivotData(data));
</script>

<Table data={pivotedData} columns={makeColumns(pivotedData)} sortable compact height={400} />
