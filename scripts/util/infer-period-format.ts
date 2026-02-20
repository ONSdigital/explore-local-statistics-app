const getDate = (str) => new Date(str.split('/')[0]);

const oneDay = 24 * 60 * 60 * 1000;

const periods = [
	{ gap: 1, label: 'daily' },
	{ gap: 7, label: 'weekly' },
	{ gap: 31, label: 'monthly' },
	{ gap: 92, label: 'quarterly' },
	{ gap: 366, label: 'annual' },
	{ gap: 731, label: 'biennial' },
	{ gap: 1096, label: 'triennial' }
];

function getFrequency(gap) {
	for (const period of periods) {
		if (gap <= period.gap) return period.label;
	}
}

function getPeriodFormat(frequency, period) {
	if (frequency === 'daily') return 'day';

	if (!period[1]) {
		if (['monthly', 'quarterly'].includes(frequency)) return 'month';
		return 'year';
	}
	if (period[1] === 'P3M') return 'quarter';
	if (period[1].match(/P\dY/)) {
		const years = +period[1].match(/\d+/)[0];
		const mmdd = period[0].slice(5);
		const range = mmdd === '01-01' ? years - 1 : years;
		if (range === 1) {
			if (['08-01', '09-01'].includes(mmdd)) return 'academic-year';
			if (mmdd === '04-01') return 'financial-year';
		}
		return range === 0 ? 'year' : `${range}-year`;
	}
	return 'year';
}

export default function inferPeriodFormat(periods) {
	if (periods.length === 1) return { frequency: 'annual', periodFormat: 'year' };

	const sorted = [...periods].sort((a, b) => a.localeCompare(b));
	const dates = sorted.map((p) => getDate(p));

	const gapsInDays = [];
	for (let i = 1; i < dates.length; i++)
		Math.floor(gapsInDays.push((dates[i] - dates[i - 1]) / oneDay));
	const minGapInDays = Math.min(...gapsInDays);

	const frequency = getFrequency(minGapInDays);
	const periodFormat = getPeriodFormat(frequency, sorted[0].split('/'));

	return { frequency, periodFormat };
}
