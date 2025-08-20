<script>
	import { Card } from '@onsvisual/svelte-components';
	import Icon from '$lib/components/Icon.svelte';

	export let indicator;
	export let value;
	export let metadata;
</script>

<Card
	title={indicator === 'population-indicators-5-year population change'
		? 'Population change'
		: metadata.label}
	id="{metadata.slug}-card"
>
	<p class="ons-card__subtitle ons-u-mb-xs">{value.xDomainNumb}</p>
	<p class="ons-card__figure ons-u-fs-3xl ons-u-fw-b ons-u-mb-no">
		{metadata.canBeNegative === 'T' && value.value > 0
			? '+'
			: ''}{metadata.prefix}{value.value.toLocaleString('en-GB', {
			minimumFractionDigits: metadata.decimalPlaces,
			maximumFractionDigits: metadata.decimalPlaces
		})}{metadata.suffix}
	</p>
	<p class="ons-card__body ons-u-mb-xs">
		{indicator === 'population-indicators-5-year population change'
			? `5-year change since ${value.xDomainNumb - 5}`
			: metadata.subText}
	</p>
	<p class="ons-u-mb-no">
		<a href="#{metadata.slug}"><Icon type="arrow" rotation={-90} /> View indicator</a>
	</p>
</Card>
