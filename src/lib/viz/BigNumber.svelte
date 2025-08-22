<script>
	import { Card } from '@onsvisual/svelte-components';
	import Icon from '$lib/components/Icon.svelte';

	export let indicator;
	export let value;
	export let meta;
	export let periods;

	$: periodsLookup = (() => {
		const lookup = {};
		for (const p of periods) lookup[p.xDomainNumb] = p;
		return lookup;
	})();
</script>

<Card
	title={indicator === 'population-indicators-5-year population change'
		? 'Population change'
		: meta.label}
	id="{meta.slug}-card"
>
	<p class="ons-card__subtitle ons-u-mb-xs">{periodsLookup[value.xDomainNumb].label}</p>
	<p class="ons-card__figure ons-u-fs-3xl ons-u-fw-b ons-u-mb-no">
		{meta.canBeNegative === 'T' && value.value > 0
			? '+'
			: ''}{meta.prefix}{value.value.toLocaleString('en-GB', {
			minimumFractionDigits: meta.decimalPlaces,
			maximumFractionDigits: meta.decimalPlaces
		})}{meta.suffix}
	</p>
	<p class="ons-card__body ons-u-mb-xs">
		{indicator === 'population-indicators-5-year population change'
			? `5-year change since ${value.xDomainNumb - 5}`
			: meta.subText}
	</p>
	<p class="ons-u-mb-no">
		<a href="#{meta.slug}"><Icon type="arrow" rotation={-90} /> View indicator</a>
	</p>
</Card>
