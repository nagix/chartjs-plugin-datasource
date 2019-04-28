'use strict';

import JsonDataSource from './datasource.json';

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

export default JsonLinesDataSource;
