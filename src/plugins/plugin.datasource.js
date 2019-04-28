'use strict';

import Chart from 'chart.js';
import datasourceHelpers from '../helpers/helpers.datasource';

var helpers = Chart.helpers;

var EXPANDO_KEY = '$datasource';

Chart.defaults.global.plugins.datasource = {};

export default {
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
		helpers.each(extensions, function(extension) {
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
