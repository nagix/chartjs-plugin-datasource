'use strict';

import Chart from 'chart.js';
import DataSource from '../core/core.datasource';
import datasourceHelpers from '../helpers/helpers.datasource';

var helpers = Chart.helpers;

function query(obj, expr) {
	var regex = /(?:,|^)\s*(?:"([^"]*)"|'([^']*)'|([^,\s]*))/gi;
	var result = [];
	var matches, bracketKey, dotKey, nextExprWithDot, nextExpr, quotedKey, subset, i, ilen, keys;

	if (obj === undefined || expr === undefined) {
		return obj;
	}

	// Allow up to two levels of [] nesting
	matches = expr.match(/(?:\[((?:\[[^\]]*\]|[^\]])*)\]|([^.[]*))(\.?(.*))/);
	if (!matches) {
		return;
	}
	bracketKey = matches[1];
	dotKey = matches[2];
	nextExprWithDot = matches[3];
	nextExpr = nextExprWithDot ? matches[4] : undefined;

	// If the wildcard is used, return an array
	if (dotKey === '*' || bracketKey === '*') {
		if (helpers.isArray(obj)) {
			for (i = 0, ilen = obj.length; i < ilen; ++i) {
				result.push(query(obj[i], nextExpr));
			}
		} else if (datasourceHelpers.isObject(obj)) {
			keys = result._labels = Object.keys(obj);
			for (i = 0, ilen = keys.length; i < ilen; ++i) {
				result.push(query(obj[keys[i]], nextExpr));
			}
		}
		return result;
	}

	// If the dot notation is used, return a single value
	if (dotKey !== undefined) {
		return query(obj[dotKey], nextExpr);
	}

	// If the bracket notation is used, process the list and return an array or a single value
	keys = result._labels = [];
	while ((matches = regex.exec(bracketKey))) {
		quotedKey = datasourceHelpers.valueOrDefault(matches[1], matches[2]);
		if (quotedKey !== undefined) {
			subset = query(obj[quotedKey], nextExpr);
		} else {
			subset = query(obj, matches[3] + nextExprWithDot);
		}
		result.push(subset);
		keys.push(datasourceHelpers.valueOrDefault(quotedKey, matches[3]));
	}
	return result.length > 1 ? result : result[0];
}

function getSecondLevelLabels(data) {
	var dataLen = data.length;
	var array = [];
	var newArray, labels, labelLen, i, j;

	for (i = 0; i < dataLen; ++i) {
		Array.prototype.push.apply(array, data[i]._labels);
	}
	labels = datasourceHelpers.dedup(array);
	labelLen = labels.length;
	for (i = 0; i < dataLen; ++i) {
		array = data[i];
		newArray = [];
		for (j = 0; j < labelLen; ++j) {
			newArray.push(array[array._labels.indexOf(labels[j])]);
		}
		data[i] = newArray;
	}
	return labels;
}

function getPointData(array, datasetLabels, datapointLabelMapping) {
	var keys = Object.keys(datapointLabelMapping);
	var datapointLabelLookup = {};
	var datasetLabelLookup = {};
	var result = [];
	var key, obj, newObj, datapointLabel, datapointValue, i, j, ilen, jlen;

	for (i = 0, ilen = keys.length; i < ilen; ++i) {
		key = keys[i];
		if (key !== '_index') {
			datapointLabelLookup[datapointLabelMapping[key]] = key;
		}
	}
	for (i = 0, ilen = datasetLabels.length; i < ilen; ++i) {
		datasetLabelLookup[datasetLabels[i]] = i;
		result[i] = [];
	}
	for (i = 0, ilen = array.length; i < ilen; ++i) {
		obj = array[i];
		keys = Object.keys(obj);
		newObj = {};
		for (j = 0, jlen = keys.length; j < jlen; ++j) {
			key = keys[j];
			datapointLabel = datapointLabelLookup[key] || key;
			datapointValue = obj[key];
			if (datapointLabel === '_dataset') {
				result[datasetLabelLookup[datapointValue]].push(newObj);
			} else {
				newObj[datapointLabel] = datapointValue;
			}
		}
	}
	return result;
}

var JsonDataSource = DataSource.extend({
	_defaultConfig: {
		type: 'json',
		rowMapping: 'dataset',
		datapointLabelMapping: {
			_dataset: '_dataset',
			_index: 'x'
		}
	},

	_responseType: 'json',

	convert: function(input) {
		var me = this;
		var options = me._options;
		var datasets = [];
		var datasetLabels, indexLabels, data, i, ilen;

		switch (options.rowMapping) {
		default:
			if (options.data) {
				data = query(input, options.data);
			}
			if (options.datasetLabels) {
				datasetLabels = query(input, options.datasetLabels);
			} else if (data) {
				datasetLabels = data._labels;
			}
			if (options.indexLabels) {
				indexLabels = query(input, options.indexLabels);
			} else if (data) {
				indexLabels = getSecondLevelLabels(data);
			}
			break;
		case 'index':
			if (options.data) {
				data = query(input, options.data);
			}
			if (options.datasetLabels) {
				datasetLabels = query(input, options.datasetLabels);
			} else if (data) {
				datasetLabels = getSecondLevelLabels(data);
			}
			if (options.indexLabels) {
				indexLabels = query(input, options.indexLabels);
			} else if (data) {
				indexLabels = data._labels;
			}
			data = datasourceHelpers.transpose(data);
			break;
		case 'datapoint':
			if (options.data) {
				datasetLabels = datasourceHelpers.dedup(query(input, options.data + '.' + options.datapointLabelMapping._dataset));
				indexLabels = datasourceHelpers.dedup(query(input, options.data + '.' + options.datapointLabelMapping._index));
				data = getPointData(query(input, options.data), datasetLabels, options.datapointLabelMapping);
			}
			break;
		}

		for (i = 0, ilen = Math.max(datasetLabels.length, data.length); i < ilen; ++i) {
			datasets.push({
				label: datasetLabels[i],
				data: data[i]
			});
		}

		return {
			labels: indexLabels,
			datasets: datasets
		};
	}
});

JsonDataSource._extensions = ['json'];

export default JsonDataSource;
