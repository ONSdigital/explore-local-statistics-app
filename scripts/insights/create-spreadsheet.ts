import fs from 'node:fs';
import JSZip from 'jszip';
import accessibleSpreadsheetCreator from 'accessible-spreadsheet-creator';

const getUnit = (ind) => ind.subText || ind.suffix || ind.prefix;

export function createSpreadsheet(data, metadata, periods, filename) {
	const odsData = {
		coverSheetTitle: 'Explore local statistics data',
		coverSheetContents: [
			'## Source',
			'Office for National Statistics (ONS) and other producers of official statistics.',
			'[Visit Explore Local Statistics on the ONS website](http://explore-local-statistics.beta.ons.gov.uk/)',
			'## Notes',
			'Some cells are blank, indicating unavailable data.',
			'Some indicators use custom time intervals format for periods, YYYY-MM-DDT00:00:00/PnI, where P tells that this is period; n is the number of intervals and I is interval type which can be Y(year), M(month), W(week), D(day).'
		],
		notes: [],
		sheets: []
	};

	const periodsMap = makePeriodsMap(periods);

	for (const topic of metadata.topicsArray) {
		for (const subTopic of topic.subTopics) {
			for (const indicatorCode of subTopic.indicatorCodes) {
				const {
					label,
					slug,
					decimalPlaces,
					subtitle,
					sourceOrg,
					sourceDate,
					sourceURL,
					longDescription,
					subText
				} = metadata.indicatorsObject[indicatorCode].metadata;
				const unit = getUnit(metadata.indicatorsObject[indicatorCode].metadata);
				const { id, code, areacd, value, lci, uci, xDomainNumb } = data[indicatorCode];
				if (![0, 1].includes(decimalPlaces)) {
					throw new Error('Unexpected number of decimal places.');
				}
				const numberStyle = decimalPlaces === 0 ? 'number_with_commas' : 'number_1dp';
				const values = value
					.map((v, i) => ({
						value: v,
						lci: lci[i],
						uci: uci[i],
						areacd: areacd[i],
						areanm: metadata.areasObject[areacd[i]].areanm,
						xDomainNumb: xDomainNumb[i],
						period: periodsMap.get(`${id};${xDomainNumb[i]}`)
					}))
					.sort((a, b) => {
						if (a.areacd < b.areacd) return -1;
						if (a.areacd > b.areacd) return 1;
						return a.xDomainNumb - b.xDomainNumb;
					});
				const columns = [
					{
						style: 'text',
						heading: 'Area code',
						values: values.map((d) => d.areacd)
					},
					{
						style: 'text',
						heading: 'Area name',
						values: values.map((d) => d.areanm)
					},
					{
						style: 'text',
						heading: 'Period',
						values: values.map((d) => d.period)
					},
					{
						style: numberStyle,
						allowNulls: true,
						heading: unit ? `Value (${unit})` : 'Value',
						values: values.map((d) => d.value)
					}
				];
				if (lci.some((d) => d != null) || uci.some((d) => d != null)) {
					columns.push({
						style: numberStyle,
						allowNulls: true,
						heading: 'Confidence interval lower',
						values: values.map((d) => d.lci)
					});
					columns.push({
						style: numberStyle,
						allowNulls: true,
						heading: 'Confidence interval upper',
						values: values.map((d) => d.uci)
					});
				}
				const sourceOrgs = sourceOrg.split('|');
				const sourceDates = sourceDate.split('|');
				const sourceURLs = sourceURL.split('|');
				const sources = sourceOrgs
					.map((s, i) => [
						`Source${sourceOrgs.length > 1 ? ` ${i + 1}` : ''}: ${s}, ${sourceDates[i]}`,
						sourceURLs[i]
					])
					.flat();
				const sheetIntroText = [`${subtitle.trim()}.`, ...sources];
				odsData.sheets.push({
					sheetName: `${label} [[note-${slug}]]`,
					tableName: slug.replaceAll('-', '_'),
					sheetIntroText,
					columns
				});
				odsData.notes.push({ name: `note-${slug}`, text: longDescription });
			}
		}
	}

	const zipFiles = accessibleSpreadsheetCreator(odsData);

	const zip = new JSZip();
	for (const { filename, contents } of zipFiles) {
		zip.file(filename, contents, {
			compression: filename === 'mimetype' ? 'STORE' : 'DEFLATE'
		});
	}

	zip
		.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
		.pipe(fs.createWriteStream(filename))
		.on('finish', () => {
			//console.log(`Spreadsheet file ${filename} written.`);
			console.log('running of the generate-data script completed');
		});
}

function makePeriodsMap(periods) {
	const map = new Map();
	for (const { id, xDomainNumb, period } of periods) {
		map.set(`${id};${xDomainNumb}`, period);
	}
	return map;
}
