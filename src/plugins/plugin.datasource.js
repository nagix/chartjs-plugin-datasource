'use strict';

import Chart from 'chart.js';
import datasourceHelpers from '../helpers/helpers.datasource';

var helpers = Chart.helpers;

var EXPANDO_KEY = '$datasource';

Chart.defaults.global.plugins.datasource = {};

function mergeData(target, source) {
	var sourceDatasets = source.datasets;
	var targetDatasets = target.datasets;
	var sourceLabels = source.labels;
	var targetLabels = target.labels;
	var max = 0;
	var sourceDataset, targetDataset, sourceLabel, sourceData, i, ilen;

	if (helpers.isArray(sourceDatasets)) {
		if (!helpers.isArray(targetDatasets)) {
			targetDatasets = target.datasets = [];
		}
		for (i = 0, ilen = sourceDatasets.length; i < ilen; ++i) {
			sourceDataset = sourceDatasets[i];
			targetDataset = targetDatasets[i];
			if (!datasourceHelpers.isObject(targetDataset)) {
				targetDataset = targetDatasets[i] = {};
			}
			sourceLabel = sourceDataset.label;
			if (sourceLabel !== undefined) {
				targetDataset.label = sourceLabel;
			} else if (targetDataset.label === undefined) {
				targetDataset.label = 'Dataset ' + (i + 1);
			}
			sourceData = sourceDataset.data;
			if (helpers.isArray(sourceData)) {
				targetDataset.data = sourceData;
				max = Math.max(max, sourceData.length);
			}
		}
	}
	if (helpers.isArray(sourceLabels)) {
		target.labels = sourceLabels;
	} else if (!helpers.isArray(targetLabels) || !targetLabels.length) {
		targetLabels = target.labels = [];
		for (i = 0; i < max; ++i) {
			targetLabels[i] = '' + (i + 1);
		}
	}
}

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
				mergeData(chart.data, response.data);
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
