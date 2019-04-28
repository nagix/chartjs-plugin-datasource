'use strict';

import Chart from 'chart.js';
import datasources from './datasources/index';
import DataSourcePlugin from './plugins/plugin.datasource';

Chart.helpers.each(datasources, function(datasource, type) {
	DataSourcePlugin.register(type, datasource, datasource._extensions, datasource._defaults);
});

export default DataSourcePlugin;
