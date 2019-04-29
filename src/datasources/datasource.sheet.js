'use strict';

import Chart from 'chart.js';
import XLSX from 'xlsx';
import DataSource from '../core/core.datasource';
import datasourceHelpers from '../helpers/helpers.datasource';

var helpers = Chart.helpers;

function parseExpression(workbook, expr) {
	var matches, sheetName, sheet, rangeExpr, ref, range, refRange;

	while (expr) {
		if (expr.match(/^(([A-Z]+\d*|[A-Z]*\d+):([A-Z]+\d*|[A-Z]*\d+)|[A-Z]+\d+)$/)) {
			rangeExpr = expr;
			break;
		} else if (sheetName) {
			break;
		}
		matches = expr.match(/^(?:'([^']*)'|([^!]*))(?:!(.*))?$/);
		sheetName = datasourceHelpers.valueOrDefault(matches[1], matches[2]);
		expr = matches[3];
	}
	sheet = workbook.Sheets[datasourceHelpers.valueOrDefault(sheetName, workbook.SheetNames[0])];
	ref = sheet ? sheet['!ref'] : '';
	range = XLSX.utils.decode_range(datasourceHelpers.valueOrDefault(rangeExpr, ref));

	if (ref) {
		refRange = XLSX.utils.decode_range(ref);
		if (range.s.c === -1) {
			range.s = {c: refRange.s.c, r: range.s.r};
		}
		if (range.e.c === -1) {
			range.e = {c: refRange.e.c, r: range.e.r};
		}
		if (isNaN(range.s.r)) {
			range.s = {c: range.s.c, r: refRange.s.r};
		}
		if (isNaN(range.e.r)) {
			range.e = {c: range.e.c, r: refRange.e.r};
		}
	}

	return {
		sheet: sheet,
		range: range,
		detected: rangeExpr === undefined
	};
}

function query(sheetRange, columnOriented) {
	var sheet = sheetRange.sheet;
	var range = sheetRange.range;
	var r = columnOriented ? 'c' : 'r';
	var c = columnOriented ? 'r' : 'c';
	var results = [];
	var result, cellExpr, cell, i, j, ilen, jlen;

	if (!sheet) {
		return results;
	}

	for (i = range.s[r], ilen = range.e[r]; i <= ilen; ++i) {
		result = [];
		for (j = range.s[c], jlen = range.e[c]; j <= jlen; ++j) {
			cellExpr = {};
			cellExpr[r] = i;
			cellExpr[c] = j;
			cell = sheet[XLSX.utils.encode_cell(cellExpr)] || {};
			result.push(cell.v);
		}
		results.push(result.length > 1 ? result : result[0]);
	}
	return results;
}

function getRowHeader(sheetRange) {
	var range = helpers.clone(sheetRange.range);

	if (range.s.r >= range.e.r) {
		return;
	}
	range.e.r = range.s.r;
	sheetRange.range.s.r++;
	return query({
		sheet: sheetRange.sheet,
		range: range
	}, true);
}

function getColumnHeader(sheetRange) {
	var range = helpers.clone(sheetRange.range);

	if (range.s.c >= range.e.c) {
		return;
	}
	range.e.c = range.s.c;
	sheetRange.range.s.c++;
	return query({
		sheet: sheetRange.sheet,
		range: range
	});
}

function formatLabels(labels, length) {
	var ilen = datasourceHelpers.valueOrDefault(length, labels.length);
	var i;

	for (i = 0; i < ilen; ++i) {
		labels[i] = datasourceHelpers.valueOrDefault(labels[i], '');
	}
}

function getIndex(value, array, offset) {
	if (value.match(/^[A-Z]+$/)) {
		return XLSX.utils.decode_col(value) - offset;
	}
	return array.indexOf(value);
}

function getLables(sheetRange, value, datapointLabels) {
	var range = helpers.clone(sheetRange.range);
	var index = getIndex(value, datapointLabels, range.s.c);

	range.s.c = range.e.c = index !== -1 ? index + range.s.c : index;
	return datasourceHelpers.dedup(query({
		sheet: sheetRange.sheet,
		range: range
	}));
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

var SheetDataSource = DataSource.extend({
	_defaultConfig: {
		type: 'sheet',
		rowMapping: 'dataset',
		datapointLabelMapping: {
			_dataset: '_dataset',
			_index: 'x'
		}
	},

	_responseType: 'arraybuffer',

	convert: function(input) {
		var me = this;
		var options = me._options;
		var workbook = XLSX.read(new Uint8Array(input), {type: 'array'});
		var dataRange = parseExpression(workbook, datasourceHelpers.valueOrDefault(options.data, ''));
		var detected = dataRange.detected;
		var datasets = [];
		var datapointLabels, datasetLabels, indexLabels, data, i, ilen;

		switch (options.rowMapping) {
		default:
			if (options.indexLabels) {
				indexLabels = query(parseExpression(workbook, options.indexLabels), true);
			} else if (detected) {
				indexLabels = getRowHeader(dataRange);
			} else {
				indexLabels = [];
			}
			if (options.datasetLabels) {
				datasetLabels = query(parseExpression(workbook, options.datasetLabels));
			} else if (detected) {
				if (indexLabels) {
					indexLabels.shift();
				}
				datasetLabels = getColumnHeader(dataRange);
			} else {
				datasetLabels = [];
			}
			data = query(dataRange);
			formatLabels(indexLabels, dataRange.range.e.c - dataRange.range.s.c + 1);
			formatLabels(datasetLabels, dataRange.range.e.r - dataRange.range.s.r + 1);
			break;
		case 'index':
			if (options.datasetLabels) {
				datasetLabels = query(parseExpression(workbook, options.datasetLabels), true);
			} else if (detected) {
				datasetLabels = getRowHeader(dataRange);
			} else {
				datasetLabels = [];
			}
			if (options.indexLabels) {
				indexLabels = query(parseExpression(workbook, options.indexLabels));
			} else if (detected) {
				if (datasetLabels) {
					datasetLabels.shift();
				}
				indexLabels = getColumnHeader(dataRange);
			} else {
				indexLabels = [];
			}
			data = query(dataRange, true);
			formatLabels(datasetLabels, dataRange.range.e.c - dataRange.range.s.c + 1);
			formatLabels(indexLabels, dataRange.range.e.r - dataRange.range.s.r + 1);
			break;
		case 'datapoint':
			if (options.datapointLabels) {
				datapointLabels = query(parseExpression(workbook, options.datapointLabels), true);
			} else if (detected) {
				datapointLabels = getRowHeader(dataRange);
			}
			if (datapointLabels === undefined) {
				datapointLabels = ['_dataset', 'x', 'y', 'r'];
			}
			datasetLabels = getLables(dataRange, options.datapointLabelMapping._dataset, datapointLabels);
			indexLabels = getLables(dataRange, options.datapointLabelMapping._index, datapointLabels);
			datapointLabels = convertDatapointLabels(datapointLabels, options.datapointLabelMapping);
			data = getPointData(query(dataRange), datasetLabels, datapointLabels);
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

SheetDataSource._extensions = [
	'xlsx', 'xlsm', 'xlsb', 'xls', 'xlw', 'xml', 'csv', 'txt', 'dif', 'sylk', 'slk',
	'prn', 'ods', 'fods', 'uos', 'dbf', 'wks', 'wk1', 'wk2', 'wk3', 'wk4', '123',
	'wq1', 'wq2', 'wb1', 'wb2', 'wb3', 'qpw', 'html', 'htm', 'eth'
];

export default SheetDataSource;
