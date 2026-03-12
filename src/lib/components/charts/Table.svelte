<script>
	import { Table } from '@onsvisual/svelte-components';
	import { shortenPeriodFormatter } from '$lib/utils';

	let {
		data,
		formatValue = (d) => d,
		formatPeriod = (d) => d,
		selected = null,
		hovered = $bindable(),
		geoLevel = null
	} = $props();

	let formatPeriodShort = $derived(shortenPeriodFormatter(formatPeriod));

	function pivotData(data) {
		const piv = {};

		for (let i = 0; i < data?.areacd?.length; i++) {
			const areacd = data.areacd[i];
			if (!piv[areacd]) piv[areacd] = { areacd, areanm: data.areanm[i] };
			piv[areacd][data.period[i]] = data.value[i];
		}
		return Object.values(piv);
	}

	function makeColumns(data) {
		const keys = Object.keys(data[0]).sort((a, b) => {
			if (a === 'areacd' || a === 'areanm') return a === 'areacd' ? -1 : b === 'areacd' ? 1 : -1;
			if (b === 'areacd' || b === 'areanm') return 1;
			return b.localeCompare(a);
		});

		return keys.map((key) => ({
			key,
			label:
				key === 'areacd' ? 'Area code' : key === 'areanm' ? 'Area name' : formatPeriodShort(key),
			numeric: !['areacd', 'areanm'].includes(key),
			formatter: formatValue
		}));
	}

	let pivotedData = $derived(
		data ? pivotData(data).sort((a, b) => a.areanm.localeCompare(b.areanm)) : null
	);
	$inspect(pivotedData);
</script>

<Table data={pivotedData} columns={makeColumns(pivotedData)} sortable compact height={400} />
