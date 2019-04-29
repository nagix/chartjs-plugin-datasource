/*!
 * chartjs-plugin-datasource v0.1.0
 * https://nagix.github.io/chartjs-plugin-datasource
 * (c) 2019 Akihiko Kusanagi
 * Released under the MIT license
 */
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('chart.js'), require('xlsx')) :
typeof define === 'function' && define.amd ? define(['chart.js', 'xlsx'], factory) :
(global = global || self, global.ChartDataSource = factory(global.Chart, global.XLSX));
}(this, function (Chart, XLSX) { 'use strict';

Chart = Chart && Chart.hasOwnProperty('default') ? Chart['default'] : Chart;
XLSX = XLSX && XLSX.hasOwnProperty('default') ? XLSX['default'] : XLSX;

var helpers = Chart.helpers;

// Base class for all data source (csv, json, etc)
var DataSource = function(chart, options) {
	this.initialize(chart, options);
};

helpers.extend(DataSource.prototype, {
	_defaultConfig: {},

	_responseType: null,

	initialize: function(chart, options) {
		var me = this;

		me._chart = chart;
		me._options = helpers.extend({}, me._defaultConfig, options);
	},

	request: function(callback) {
		var me = this;
		var url = me.getUrl();
		var xhr = new XMLHttpRequest();

		xhr.open('GET', url);
		xhr.responseType = me._responseType;
		xhr.onreadystatechange = function() {
			var data;

			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					data = me.convert(xhr.response);
				}
				callback.call(me, {
					success: xhr.status === 200,
					data: data
				});
			}
		};
		xhr.send();
	},

	convert: function() {
		// noop
	},

	getType: function() {
		return this._options.type;
	},

	getUrl: function() {
		return this._options.url;
	}
});

DataSource.extend = helpers.inherits;

var helpers$1 = Chart.helpers;

var datasourceHelpers = {
	// For Chart.js 2.6.0 backward compatibility
	isObject: helpers$1.isObject || function(value) {
		return value !== null && Object.prototype.toString.call(value) === '[object Object]';
	},

	// For Chart.js 2.6.0 backward compatibility
	valueOrDefault: helpers$1.valueOrDefault || helpers$1.getValueOrDefault,

	merge: function(target, source) {
		var keys, key, i, ilen;

		if (helpers$1.isArray(source)) {
			if (!helpers$1.isArray(target)) {
				target = [];
			}
			for (i = 0, ilen = source.length; i < ilen; ++i) {
				target[i] = datasourceHelpers.merge(target[i], source[i]);
			}
		} else if (datasourceHelpers.isObject(source)) {
			if (!datasourceHelpers.isObject(target)) {
				target = {};
			}
			keys = Object.keys(source);
			for (i = 0, ilen = keys.length; i < ilen; ++i) {
				key = keys[i];
				target[key] = datasourceHelpers.merge(target[key], source[key]);
			}
		} else {
			target = source;
		}

		return target;
	},

	getExtension: function(url) {
		var matches = url.match(/\.([0-9a-z]+)(?:[?#]|$)/i);

		if (matches) {
			return matches[1];
		}
	},

	transpose: function(arrays) {
		var columns = arrays[0].length;
		var rows = arrays.length;
		var result = [];
		var i, j, array;

		for (i = 0; i < columns; ++i) {
			array = [];
			for (j = 0; j < rows; ++j) {
				array.push(arrays[j][i]);
			}
			result.push(array);
		}
		return result;
	},

	dedup: function(array) {
		return array.filter(function(value, i) {
			return array.indexOf(value) === i;
		});
	}
};

var helpers$2 = Chart.helpers;

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
	if (helpers$2.isFinite(value) && value >= 0 && Math.floor(value) === value) {
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

var helpers$3 = Chart.helpers;

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
		if (helpers$3.isArray(obj)) {
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

function getFirstLevelLabels(data) {
	if (data._labels !== undefined) {
		return data._labels;
	}
	return Array.apply(null, Array(data.length)).map(function() {
		return '';
	});
}

function getSecondLevelLabels(data) {
	var dataLen = data.length;
	var array = [];
	var max = 0;
	var newArray, labels, labelLen, i, j;

	for (i = 0; i < dataLen; ++i) {
		Array.prototype.push.apply(array, data[i]._labels);
		max = Math.max(max, data[i].length);
	}
	if (!array.length) {
		return Array.apply(null, Array(max)).map(function() {
			return '';
		});
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

function getPointData$1(array, datasetLabels, datapointLabelMapping) {
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
				datasetLabels = getFirstLevelLabels(data);
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
				indexLabels = getFirstLevelLabels(data);
			}
			data = datasourceHelpers.transpose(data);
			break;
		case 'datapoint':
			if (options.data) {
				datasetLabels = datasourceHelpers.dedup(query(input, options.data + '.' + options.datapointLabelMapping._dataset));
				indexLabels = datasourceHelpers.dedup(query(input, options.data + '.' + options.datapointLabelMapping._index));
				data = getPointData$1(query(input, options.data), datasetLabels, options.datapointLabelMapping);
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

var JsonLinesDataSource = JsonDataSource.extend({
	_defaultConfig: {
		type: 'jsonl',
		rowMapping: 'index',
		datapointLabelMapping: {
			_dataset: '_dataset',
			_index: 'x'
		}
	},

	_responseType: 'text',

	convert: function(input) {
		var array = JSON.parse('[' + input.trim().split('\n').join(',') + ']');

		return JsonDataSource.prototype.convert.call(this, array);
	}
});

JsonLinesDataSource._extensions = ['jsonl'];

var helpers$4 = Chart.helpers;

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

function query$1(sheetRange, columnOriented) {
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

function getRowHeader$1(sheetRange) {
	var range = helpers$4.clone(sheetRange.range);

	if (range.s.r >= range.e.r) {
		return;
	}
	range.e.r = range.s.r;
	sheetRange.range.s.r++;
	return query$1({
		sheet: sheetRange.sheet,
		range: range
	}, true);
}

function getColumnHeader$1(sheetRange) {
	var range = helpers$4.clone(sheetRange.range);

	if (range.s.c >= range.e.c) {
		return;
	}
	range.e.c = range.s.c;
	sheetRange.range.s.c++;
	return query$1({
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

function getIndex$1(value, array, offset) {
	if (value.match(/^[A-Z]+$/)) {
		return XLSX.utils.decode_col(value) - offset;
	}
	return array.indexOf(value);
}

function getLables(sheetRange, value, datapointLabels) {
	var range = helpers$4.clone(sheetRange.range);
	var index = getIndex$1(value, datapointLabels, range.s.c);

	range.s.c = range.e.c = index !== -1 ? index + range.s.c : index;
	return datasourceHelpers.dedup(query$1({
		sheet: sheetRange.sheet,
		range: range
	}));
}

function convertDatapointLabels$1(labels, mapping) {
	var keys = Object.keys(mapping);
	var result = labels.slice();
	var key, index, i, ilen;

	for (i = 0, ilen = keys.length; i < ilen; ++i) {
		key = keys[i];
		index = getIndex$1(mapping[key], labels);
		if (index !== -1 && key !== '_index') {
			result[index] = key;
		}
	}
	return result;
}

function getPointData$2(arrays, datasetLabels, datapointLabels) {
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
				indexLabels = query$1(parseExpression(workbook, options.indexLabels), true);
			} else if (detected) {
				indexLabels = getRowHeader$1(dataRange);
			} else {
				indexLabels = [];
			}
			if (options.datasetLabels) {
				datasetLabels = query$1(parseExpression(workbook, options.datasetLabels));
			} else if (detected) {
				if (indexLabels) {
					indexLabels.shift();
				}
				datasetLabels = getColumnHeader$1(dataRange);
			} else {
				datasetLabels = [];
			}
			data = query$1(dataRange);
			formatLabels(indexLabels, dataRange.range.e.c - dataRange.range.s.c + 1);
			formatLabels(datasetLabels, dataRange.range.e.r - dataRange.range.s.r + 1);
			break;
		case 'index':
			if (options.datasetLabels) {
				datasetLabels = query$1(parseExpression(workbook, options.datasetLabels), true);
			} else if (detected) {
				datasetLabels = getRowHeader$1(dataRange);
			} else {
				datasetLabels = [];
			}
			if (options.indexLabels) {
				indexLabels = query$1(parseExpression(workbook, options.indexLabels));
			} else if (detected) {
				if (datasetLabels) {
					datasetLabels.shift();
				}
				indexLabels = getColumnHeader$1(dataRange);
			} else {
				indexLabels = [];
			}
			data = query$1(dataRange, true);
			formatLabels(datasetLabels, dataRange.range.e.c - dataRange.range.s.c + 1);
			formatLabels(indexLabels, dataRange.range.e.r - dataRange.range.s.r + 1);
			break;
		case 'datapoint':
			if (options.datapointLabels) {
				datapointLabels = query$1(parseExpression(workbook, options.datapointLabels), true);
			} else if (detected) {
				datapointLabels = getRowHeader$1(dataRange);
			}
			if (datapointLabels === undefined) {
				datapointLabels = ['_dataset', 'x', 'y', 'r'];
			}
			datasetLabels = getLables(dataRange, options.datapointLabelMapping._dataset, datapointLabels);
			indexLabels = getLables(dataRange, options.datapointLabelMapping._index, datapointLabels);
			datapointLabels = convertDatapointLabels$1(datapointLabels, options.datapointLabelMapping);
			data = getPointData$2(query$1(dataRange), datasetLabels, datapointLabels);
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

var datasources = {
	csv: CsvDataSource,
	json: JsonDataSource,
	jsonl: JsonLinesDataSource,
	sheet: SheetDataSource
};

var helpers$5 = Chart.helpers;

var EXPANDO_KEY = '$datasource';

Chart.defaults.global.plugins.datasource = {};

var DataSourcePlugin = {
	id: 'datasource',

	beforeInit: function(chart) {
		chart[EXPANDO_KEY] = {};
	},

	beforeUpdate: function(chart, options) {
		var me = this;
		var expando = chart[EXPANDO_KEY];
		var url = options.url;
		var type = options.type || me.getType(url);
		var DataSourceClass = me.getConstructor(type);
		var datasource = expando._datasource;

		if (url && DataSourceClass && !chart[EXPANDO_KEY]._delayed) {
			if (!datasource || datasource.getType() !== type || datasource.getUrl() !== url) {
				datasource = expando._datasource = new DataSourceClass(chart, options);
			}
			datasource.request(function(response) {
				chart.data.labels = [];
				chart.data.datasets.forEach(function(dataset) {
					dataset.data = [];
				});
				datasourceHelpers.merge(chart.data, response.data);

				expando._delayed = true;
				chart.update();
				delete expando._delayed;
			});
			return false;
		}
	},

	constructors: {},
	extensions: {},

	register: function(type, constructor, extensions) {
		var me = this;

		me.constructors[type] = constructor;
		helpers$5.each(extensions, function(extension) {
			me.extensions[extension] = type;
		});
	},

	getType: function(url) {
		if (url) {
			return this.extensions[datasourceHelpers.getExtension(url)] || 'json';
		}
	},

	getConstructor: function(type) {
		return this.constructors.hasOwnProperty(type) ? this.constructors[type] : undefined;
	}
};

Chart.helpers.each(datasources, function(datasource, type) {
	DataSourcePlugin.register(type, datasource, datasource._extensions, datasource._defaults);
});

return DataSourcePlugin;

}));
