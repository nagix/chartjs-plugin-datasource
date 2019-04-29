'use strict';

import Chart from 'chart.js';
import DataSource from '../core/core.datasource';
import datasourceHelpers from '../helpers/helpers.datasource';

var helpers = Chart.helpers;

function getDelimiter(url) {
	switch (datasourceHelpers.getExtension(url)) {
	default:
		return ',';
	case 'tsv':
		return '\t';
	case 'psv':
		return '|';
	}
}

function csvToArrays(str, delimiter) {
	var regex = new RegExp('(' + delimiter +
		'|\r?\n(?!$)|\r(?!$)|^(?!$))(?:"((?:\\.|""|[^\\"])*)"|([^' + delimiter + '"\r\n]*))', 'gi');
	var array = [];
	var arrays = [array];
	var max = 0;
	var matches, i, ilen, j;

	while ((matches = regex.exec(str))) {
		if (matches[1]) {
			if (matches[1] !== delimiter) {
				array = [];
				arrays.push(array);
			} else if (arrays.length === 1 && array.length === 0) {
				array.push(undefined);
			}
		}
		array.push(matches[2] !== undefined ? matches[2].replace(/[\\"](.)/g, '$1') : matches[3] ? matches[3] : undefined);
		max = Math.max(max, array.length);
	}
	for (i = 0, ilen = arrays.length; i < ilen; ++i) {
		array = arrays[i];
		for (j = array.length; j < max; ++j) {
			array.push(undefined);
		}
	}
	return arrays;
}

function getRowHeader(arrays, hasHeader) {
	if (!arrays.length) {
		return [];
	} else if (!hasHeader) {
		return Array.apply(null, Array(arrays[0].length)).map(function() {
			return '';
		});
	}
	return arrays.shift().map(function(value) {
		return datasourceHelpers.valueOrDefault(value, '');
	});
}

function getColumnHeader(arrays, hasHeader) {
	if (!hasHeader) {
		return Array.apply(null, Array(arrays.length)).map(function() {
			return '';
		});
	}
	return arrays.map(function(array) {
		return datasourceHelpers.valueOrDefault(array.shift(), '');
	});
}

function getIndex(value, array) {
	if (helpers.isFinite(value) && value >= 0 && Math.floor(value) === value) {
		return value;
	}
	return array.indexOf(value);
}

function getLabels(arrays, value, datapointLabels) {
	var index = getIndex(value, datapointLabels);
	var result = [];
	var i, ilen;

	for (i = 0, ilen = arrays.length; i < ilen; ++i) {
		result.push(arrays[i][index]);
	}
	return datasourceHelpers.dedup(result);
}

function convertDatapointLabels(labels, mapping) {
	var keys = Object.keys(mapping);
	var result = labels.slice();
	var key, index, i, ilen;

	for (i = 0, ilen = keys.length; i < ilen; ++i) {
		key = keys[i];
		index = getIndex(mapping[key], labels);
		if (index !== -1 && key !== '_index') {
			result[index] = key;
		}
	}
	return result;
}

function getPointData(arrays, datasetLabels, datapointLabels) {
	var lookup = {};
	var result = [];
	var array, obj, datapointLabel, datapointValue, i, j, ilen, jlen;

	for (i = 0, ilen = datasetLabels.length; i < ilen; ++i) {
		lookup[datasetLabels[i]] = i;
		result[i] = [];
	}
	for (i = 0, ilen = arrays.length; i < ilen; ++i) {
		array = arrays[i];
		obj = {};
		for (j = 0, jlen = array.length; j < jlen; ++j) {
			datapointLabel = datapointLabels[j];
			datapointValue = array[j];
			if (datapointLabel === '_dataset') {
				result[lookup[datapointValue]].push(obj);
			} else {
				obj[datapointLabel] = datapointValue;
			}
		}
	}

	return result;
}

var CsvDataSource = DataSource.extend({
	_defaultConfig: {
		type: 'csv',
		rowMapping: 'dataset',
		datasetLabels: true,
		indexLabels: true,
		datapointLabels: true,
		datapointLabelMapping: {
			_dataset: '_dataset',
			_index: 'x'
		}
	},

	_responseType: 'text',

	initialize: function() {
		var me = this;
		var options;

		DataSource.prototype.initialize.apply(me, arguments);
		options = me._options;
		if (options.delimiter === undefined) {
			options.delimiter = getDelimiter(options.url);
		}
	},

	convert: function(input) {
		var me = this;
		var options = me._options;
		var arrays = csvToArrays(input, options.delimiter);
		var datasets = [];
		var datapointLabels, datasetLabels, indexLabels, data, i, ilen;

		switch (options.rowMapping) {
		default:
			indexLabels = getRowHeader(arrays, options.indexLabels);
			datasetLabels = getColumnHeader(arrays, options.datasetLabels);
			if (options.datasetLabels === true) {
				indexLabels.shift();
			}
			data = arrays;
			break;
		case 'index':
			datasetLabels = getRowHeader(arrays, options.datasetLabels);
			indexLabels = getColumnHeader(arrays, options.indexLabels);
			if (options.indexLabels === true) {
				datasetLabels.shift();
			}
			data = datasourceHelpers.transpose(arrays);
			break;
		case 'datapoint':
			if (options.datapointLabels === true) {
				datapointLabels = getRowHeader(arrays, true);
			} else {
				datapointLabels = ['_dataset', 'x', 'y', 'r'];
			}
			datasetLabels = getLabels(arrays, options.datapointLabelMapping._dataset, datapointLabels);
			indexLabels = getLabels(arrays, options.datapointLabelMapping._index, datapointLabels);
			datapointLabels = convertDatapointLabels(datapointLabels, options.datapointLabelMapping);
			data = getPointData(arrays, datasetLabels, datapointLabels);
			break;
		}

		for (i = 0, ilen = datasetLabels.length; i < ilen; ++i) {
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

CsvDataSource._extensions = ['csv', 'tsv', 'psv'];

export default CsvDataSource;
