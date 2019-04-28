'use strict';

import Chart from 'chart.js';

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

export default DataSource;
