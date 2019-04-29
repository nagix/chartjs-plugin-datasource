'use strict';

import Chart from 'chart.js';

var helpers = Chart.helpers;

var datasourceHelpers = {
	// For Chart.js 2.6.0 backward compatibility
	isObject: helpers.isObject || function(value) {
		return value !== null && Object.prototype.toString.call(value) === '[object Object]';
	},

	// For Chart.js 2.6.0 backward compatibility
	valueOrDefault: helpers.valueOrDefault || helpers.getValueOrDefault,

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

export default datasourceHelpers;
