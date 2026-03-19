import getIndicators from './getIndicators';
import summaryData from '$lib/data/json-stat-summary.json';
import { capitalise } from '@onsvisual/robo-utils';

function makeItem(slug, label = null, description = null, index = 0) {
	const item = { label: label || capitalise(slug), slug };
	if (description) return { ...item, description, index };
	return { ...item, children: {} };
}

function nestTaxonomy(taxonomy) {
	const topicsIndex = {};

	let index = 0,
		topic = null;
	for (const ind of taxonomy) {
		const tpc = ind.topic;
		if (tpc !== topic) {
			topic = tpc;
			index = 0;
		} else {
			index += 1;
		}

		const indicator = makeItem(ind.slug, ind.label, ind.description, index);

		if (!topicsIndex[ind.topic]) topicsIndex[ind.topic] = { ...makeItem(ind.topic), count: 0 };
		topicsIndex[ind.topic].count += 1;

		if (ind.topic === ind.subTopic) {
			topicsIndex[ind.topic].children[ind.slug] = indicator;
		} else {
			if (!topicsIndex[ind.topic].children[ind.subTopic])
				topicsIndex[ind.topic].children[ind.subTopic] = makeItem(ind.subTopic);
			topicsIndex[ind.topic].children[ind.subTopic].children[ind.slug] = indicator;
		}
	}

	const topics = Object.values(topicsIndex);
	for (const topic of topics) {
		topic.children = Object.values(topic.children);
		if (topic.children[0].children) {
			for (const subTopic of topic.children) subTopic.children = Object.values(subTopic.children);
		}
	}
	return topics;
}

export default function getTaxonomy(params = {}) {
	const taxonomy = getIndicators({ ...params, minimalMetadata: true });
	const meta = { count: taxonomy.length, total: summaryData.datasetCount };
	const data = params.flat ? taxonomy : nestTaxonomy(taxonomy);
	return { meta, data };
}
