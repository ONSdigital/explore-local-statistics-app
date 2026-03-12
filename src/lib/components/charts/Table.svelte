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

	function makeColumns(cols) {
		const keys = [...cols].sort((a, b) => {
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

	function pivotData(data) {
		const piv = {};
		const cols = new Set(['areacd', 'areanm']);

		for (let i = 0; i < data?.areacd?.length; i++) {
			const areacd = data.areacd[i];
			if (!piv[areacd]) piv[areacd] = { areacd, areanm: data.areanm[i] };
			piv[areacd][data.period[i]] = data.value[i];
			cols.add(data.period[i]);
		}
		return {
			pivotedData: Object.values(piv).sort((a, b) => a.areanm.localeCompare(b.areanm)),
			columns: makeColumns(cols)
		};
	}

	let { pivotedData, columns } = $derived(
		data ? pivotData(data) : { pivotedData: null, columns: null }
	);
</script>

{#key pivotedData}
	<Table data={pivotedData} {columns} sortable compact height={400} />
{/key}
