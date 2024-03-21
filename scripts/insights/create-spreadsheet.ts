import fs from 'node:fs';
import JSZip from 'jszip';
import accessibleSpreadsheetCreator from 'accessible-spreadsheet-creator';

export function createSpreadsheet(data, metadata, filename) {
	const odsData = {
		coverSheetTitle: 'Explore Subnational Statistics',
		coverSheetContents: ['## Source', '[Office for National Statistics](https://www.ons.gov.uk)'],
		notes: [],
		sheets: []
	};

	const periodsMap = makePeriodsMap(metadata);

	for (const topic of metadata.topicsArray) {
		for (const subTopic of topic.subTopics) {
			for (const indicatorCode of subTopic.indicatorCodes) {
				const { label, slug, decimalPlaces, subtitle, sourceURL, longDescription, subText } =
					metadata.indicatorsObject[indicatorCode].metadata;
				const periodGroup = metadata.indicatorsObject[indicatorCode].periodGroup;
				const { id, code, areacd, value, lci, uci, xDomainNumb } = data[indicatorCode];
				if (![0, 1].includes(decimalPlaces)) {
					throw new Error('Unexpected number of decimal places.');
				}
				const numberStyle = decimalPlaces === 0 ? 'number_with_commas' : 'number_1dp';
				const nonNulls = value
					.map((v, i) => ({
						value: v,
						areacd: areacd[i],
						areanm: metadata.areasObject[areacd[i]].areanm,
						period: periodsMap.get(`${periodGroup};${xDomainNumb[i]}`)
					}))
					.filter((d) => d.value != null);
				const columns = [
					{
						style: 'text',
						heading: 'Area code',
						values: nonNulls.map((d) => d.areacd)
					},
					{
						style: 'text',
						heading: 'Area name',
						values: nonNulls.map((d) => d.areanm)
					},
					{
						style: 'text',
						heading: 'Period',
						values: nonNulls.map((d) => d.period)
					},
					{
						style: numberStyle,
						heading: 'Value',
						values: nonNulls.map((d) => d.value)
					}
				];
				const sheetIntroText = [subtitle];
				if (subText != null) {
					sheetIntroText.push(subText);
				}
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
			console.log(`Spreadsheet file ${filename} written.`);
		});
}

function makePeriodsMap(metadata) {
	const map = new Map();
	for (const { periodGroup, xDomainNumb, label } of metadata.periodsLookupArray) {
		map.set(`${periodGroup};${xDomainNumb}`, label);
	}
	return map;
}
