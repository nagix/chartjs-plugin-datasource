# chartjs-plugin-datasource

[![npm](https://img.shields.io/npm/v/chartjs-plugin-datasource.svg?style=flat-square)](https://npmjs.com/package/chartjs-plugin-datasource) [![Bower](https://img.shields.io/bower/v/chartjs-plugin-datasource.svg?style=flat-square)](https://libraries.io/bower/chartjs-plugin-datasource) [![Travis](https://img.shields.io/travis/com/nagix/chartjs-plugin-datasource/master.svg?style=flat-square)](https://travis-ci.com/nagix/chartjs-plugin-datasource) [![Code Climate](https://img.shields.io/codeclimate/maintainability/nagix/chartjs-plugin-datasource.svg?style=flat-square)](https://codeclimate.com/github/nagix/chartjs-plugin-datasource)

*[Chart.js](https://www.chartjs.org) plugin for automatic data loading*

Version 0.1 requires Chart.js 2.6.0 or later. If you use the sheet data source type, [SheetJS](https://github.com/SheetJS/js-xlsx) 0.8.0 or later is also required.

## Installation

You can download the latest version of chartjs-plugin-datasource from the [GitHub releases](https://github.com/nagix/chartjs-plugin-datasource/releases/latest).

To install via npm:

```bash
npm install chartjs-plugin-datasource --save
```

To install via bower:

```bash
bower install chartjs-plugin-datasource --save
```

To use CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datasource"></script>
```

## Usage

chartjs-plugin-datasource can be used with ES6 modules, plain JavaScript and module loaders.

chartjs-plugin-datasource requires [Chart.js](https://www.chartjs.org). If you use the sheet data source type, [SheetJS (xlsx)](https://github.com/SheetJS/js-xlsx) is also required.

First, include Chart.js, xlsx.full.js (optional) and chartjs-plugin-datasource.js to your page. Note that chartjs-plugin-datasource must be loaded after the Chart.js and SheetJS libraries. Once imported, the plugin is available under the global property `ChartDataSource`.

Then, you need to register the plugin to enable it for all charts in the page.

```js
Chart.plugins.register(ChartDataSource);
```

Or, you can enable the plugin only for specific charts.

```js
var chart = new Chart(ctx, {
    plugins: [ChartDataSource],
    options: {
        // ...
    }
});
```

 Now, a data source URL can be specified as shown in the example below. By default, each row in a CSV file will be mapped to one dataset, and the first column and the first row will be treated as dataset labels and index labels respectively.

```js
options: {
    plugins: {
        datasource: {
            url: 'sample-dataset.csv'
        }
    }
}
```

sample-dataset.csv

```csv
,January,February,March,April,May,June,July
Temperature,7,7,10,15,20,23,26
Precipitation,8.1,14.9,41.0,31.4,42.6,57.5,36.0
```

Version 0.1 supports CSV, TSV (Tab-Separated Values), PSV (Pipe-Separated Values), JSON, Excel, OpenDocument and more. More data source types are to be added in the upcoming releases.

### Usage in ES6 as module

Import the module as `ChartDataSource`, and register it in the same way as described above.

```js
import ChartDataSource from 'chartjs-plugin-datasource';
```

## Tutorial and Samples

You can find a tutorial and samples at [nagix.github.io/chartjs-plugin-datasource](https://nagix.github.io/chartjs-plugin-datasource).

## Configuration

The plugin options can be changed at 2 different levels and with the following priority:

- per chart: `options.plugins.datasource.*`
- globally: `Chart.defaults.global.plugins.datasource.*`

Common options between data source types are listed below.

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| `type` | `string` | | Data source type. [`'csv'`](#csv-data-source), [`'json'`](#json-data-source), [`'jsonl'`](#json-lines-data-source) and [`'sheet'`](#sheet-data-source) are supported by default. If not set, the type will be determined based on the [file extension](#supported-data-format) in the specified URL. If the URL doesn't have an extension, `'json'` will be set.
| `url` | `string` | | Data source URL. It must have the same origin as your page, or a response must have a proper [CORS](#cross-origin-resource-sharing-cors) header set.

### CSV Data Source

The CSV data source supports delimiter-separated values such as CSV, TSV and PSV. The following options are available in `'csv'` data type.

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| `delimiter` | `string` | | Delimiter for values. If not set, the delimiter will be determined based on the file extension in the specified URL. If the URL doesn't have an extension, `','` will be set.
| `rowMapping` | `string` | `'dataset'` | Element type to which each row is mapped. [more...](#row-mapping)
| `datasetLabels` | `boolean` | `true` | If `true`, the first column (when `rowMapping` is `'dataset'`) or the first row (when `rowMapping` is `'index'`) will be treated as dataset labels. This option is valid when `rowMapping` is `'dataset'` or `'index'`.
| `indexLabels` | `boolean` | `true` | If `true`, the first row (when `rowMapping` is `'dataset'`) or the first column (when `rowMapping` is `'index'`) will be treated as index labels. This option is valid when `rowMapping` is `'dataset'` or `'index'`.
| `datapointLabels` | `boolean` | `true` | If `true`, the first row will be treated as property labels for Point objects. If `false`, `['_dataset', 'x', 'y', 'r']` will be used. This option is valid only when `rowMapping` is `'datapoint'`.
| `datapointLabelMapping` | `object` | `{_dataset: '_dataset', _index: 'x'}` | Key-value pairs for datapoint label mapping. This option is valid only when `rowMapping` is `'datapoint'`. [more...](#datapoint-label-mapping)

### JSON Data Source

The JSON data source supports JSON data. The following options are available in `'json'` data type.

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| `rowMapping` | `string` | `'dataset'` | Element type to which each row is mapped. [more...](#row-mapping)
| `datasetLabels` | `string` | | [Simplified JSONPath](#simplified-jsonpath) expression for an array of the dataset labels. This option is valid when `rowMapping` is `'dataset'` or `'index'`. If not specified but each pair of a dataset label and data is represented as a key-value pair in the objects selected by `data`, those keys will be used. [more...](#simplified-jsonpath)
| `indexLabels` | `string` | | Simplified JSONPath expression for an array of the index labels. This option is valid when `rowMapping` is `'dataset'` or `'index'`. If not specified but each pair of an index label and data is represented as a key-value pair in the objects selected by `data`, those keys will be used. [more...](#simplified-jsonpath)
| `datapointLabelMapping` | `object` | `{_dataset: '_dataset', _index: 'x'}` | Key-value pairs for datapoint label mapping. This option is valid only when `rowMapping` is `'datapoint'`. [more...](#datapoint-label-mapping)
| `data` | `string` | | Simplified JSONPath expression for a two-dimensional array of the data. [more...](#simplified-jsonpath)

### JSON Lines Data Source

The JSON Lines data source supports [JSON Lines](http://jsonlines.org) data. The same options are supported in `'jsonl'` data type as the JSON data source, but they have different default values.

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| `rowMapping` | `string` | `'index'` | Element type to which each row is mapped. [more...](#row-mapping)
| `datasetLabels` | `string` | | [Simplified JSONPath](#simplified-jsonpath) expression for an array of the dataset labels. This option is valid when `rowMapping` is `'dataset'` or `'index'`. If not specified but each pair of a dataset label and data is represented as a key-value pair in the objects selected by `data`, those keys will be used. [more...](#simplified-jsonpath)
| `indexLabels` | `string` | | Simplified JSONPath expression for an array of the index labels. This option is valid when `rowMapping` is `'dataset'` or `'index'`. If not specified but each pair of an index label and data is represented as a key-value pair in the objects selected by `data`, those keys will be used. [more...](#simplified-jsonpath)
| `datapointLabelMapping` | `object` | `{_dataset: '_dataset', _index: 'x'}` | Key-value pairs for datapoint label mapping. This option is valid only when `rowMapping` is `'datapoint'`. [more...](#datapoint-label-mapping)
| `data` | `string` | | Simplified JSONPath expression for a two-dimensional array of the data. [more...](#simplified-jsonpath)

#### Simplified JSONPath

This plugin uses a simplified version of [JSONPath](https://goessner.net/articles/JsonPath/) expression to select an array or two-dimensional array from a JSON document. The top level element in JSON data is an object while that in JSON Lines data is an array. The following elements can be used in an expression.

| Element | Description
| ------- | -----------
| `.` or `[]` | Child/array operator.
| `*` | Wildcard. All objects/elements regardless their names.
| `[,]` | Union operator results in a combination of children/array indices sets. 

Below are a sample JSON document, Simplified JSONPath expressions and their results.

```json
{
    "labels": ["January", "February", "March", "April", "May"],
    "datasets": [{
        "label": "Temperature",
        "data": [7, 7, 10, 15, 20]
    }, {
        "label": "Precipitation",
        "data": [8.1, 14.9, 41.0, 31.4, 42.6]
    }]
}
```

| Simplified JSONPath Expression | Result
| ------------------------------ | ------
| `'labels'` | `['January', 'February', 'March', 'April', 'May']`
| `'datasets[*].label'` | `['Temperature', 'Precipitation']`
| `'datasets[*].data'` | `[[7, 7, 10, 15, 20], [8.1, 14.9, 41.0, 31.4, 42.6]]`
| `'[label[0], datasets[*].data[0]]'` | `['January', [5, 6]]`

So, the JSONPath expressions in the plugin options will look like below.

```js
options: {
    plugins: {
        datasource: {
            url: 'sample-dataset.json',
            datasetLabels: 'datasets[*].label',
            indexLabels: 'labels',
            data: 'datasets[*].data'
        }
    }
}
```

A JSON document may consist of nested objects where key-value pairs represent labels and corresponding data. In that case, dataset labels and/or index labels will be  retrieved automatically, and there is no need to specify `datasetLabels` and `indexLabels` options. The following example will generate the same chart as the previous one.

```json
{
    "Temperature": {
        "January": 7,
        "February": 7,
        "March": 10,
        "April": 15,
        "May": 20
    },
    "Precipitation": {
        "January": 8.1,
        "February": 14.9,
        "March": 41.0,
        "April": 31.4,
        "May": 42.0
    }
}
```

```js
options: {
    plugins: {
        datasource: {
            url: 'sample-dataset.json',
            data: '*.*'
        }
    }
}
```

If you want to specify the order of labels explicitly, you can use union operators as shown below.

```js
options: {
    plugins: {
        datasource: {
            url: 'sample-dataset.json',
            data: '[Temperature, Precipitation][January, February, March, April, May]'
        }
    }
}
```

### Sheet Data Source

The sheet data source supports various spreadsheet formats such as Excel and OpenDocument. The following options are available in `'sheet'` data type.

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| `rowMapping` | `string` | `'dataset'` | Element type to which each row is mapped. [more...](#row-mapping)
| `datasetLabels` | `string` | | Range for dataset labels ([A1 Notation](#a1-notation)). This option is valid when `rowMapping` is `'dataset'` or `'index'`. If neither `datasetLabels` nor `data` are specified, the first column or row from the auto-detected range will be selected.
| `indexLabels` | `string` | | Range for index labels (A1 Notation). This option is valid when `rowMapping` is `'dataset'` or `'index'`. If neither `indexLabels` nor `data` are specified, the first row or column from the auto-detected range will be selected.
| `datapointLabels` | `string` | | Range for property labels for Point objects (A1 Notation). This option is valid only when `rowMapping` is `'datapoint'`. If neither `datapointLabels` nor `data` are specified, the first row from the auto-detected range will be selected. If no data is found, `['_dataset', 'x', 'y', 'r']` will be used.
| `datapointLabelMapping` | `object` | `{_dataset: '_dataset', _index: 'x'}` | Key-value pairs for datapoint label mapping. This option is valid only when `rowMapping` is `'datapoint'`. [more...](#datapoint-label-mapping)
| `data` | `string` | | Range for the data (A1 Notation). If not specified, the range will be detected automatically.

#### A1 Notation

Some options require a range in A1 notation. This is a string like `Sheet1!A1:B2` that refers to a group of cells in the spreadsheet. For example, valid ranges are:

- `Sheet1!A1:B2` refers to the first two cells in the top two rows of Sheet1.
- `Sheet1!A:A` refers to all the cells in the first column of Sheet1.
- `Sheet1!1:2` refers to the all the cells in the first two rows of Sheet1.
- `Sheet1!A5:A` refers to all the cells of the first column of Sheet 1, from row 5 onward.
- `A1:B2` refers to the first two cells in the top two rows of the first visible sheet.
- `Sheet1` refers to all the cells in Sheet1.

If the sheet name has spaces or starts with a bracket, surround the sheet name with single quotes (`'`), e.g `'Sheet One'!A1:B2`. For simplicity, it is safe to always surround the sheet name with single quotes.

### Row Mapping

`rowMapping` indicates an element type to which each row is mapped. Available values are listed below.

- `'dataset'`
- `'index'`
- `'datapoint'`

When each row contains values for one dataset, `'dataset'` is used. In many cases, the first column contains dataset labels and the first row contains index labels. Below is an example of dataset-mapped rows.

|   | January | February | March | April | May
| - | ------: | -------: | ----: | ----: | --:
| Temperature | 7 | 7 | 10 | 15 | 20
| Precipitation | 8.1 | 14.9 | 41.0 | 31.4 | 42.6

When each row contains values for one index, `'index'` is used. In many cases, the first column contains index labels and the first row contains dataset labels. Below is an example of index-mapped rows.

|   | Temperature | Precipitation
| - | --------: | --------:
| January | 7 | 8.1
| February | 7 | 14.9
| March | 10 | 41.0
| April | 15 | 31.4
| May | 20 | 42.6

When each row contains values for one data point, `'datapoint'` is used. This type of data formatting is often called [Tidy Data](http://vita.had.co.nz/papers/tidy-data.pdf). The first row can have datapoint labels. Below is an example of datapoint-mapped rows.

| dataset | month | value
| ------- | ----- | ----:
| Temperature | January | 7
| Temperature | February | 7
| Temperature | March | 10
| Temperature | April | 15
| Temperature | May | 20
| Precipitation | January | 8.1
| Precipitation | February | 14.9
| Precipitation | March | 41.0
| Precipitation | April | 31.4
| Precipitation | May | 42.6

### Datapoint Label Mapping

If `rowMapping` is `'datapoint'`, `datapointLabelMapping` can be used to correspond each column to specific datapoint property. It consists of key-value pairs where the key is a property name in Point data used in the [line chart](https://www.chartjs.org/docs/latest/charts/line.html#point), [bubble chart](https://www.chartjs.org/docs/latest/charts/bubble.html#data-structure) and [scatter chart](https://www.chartjs.org/docs/latest/charts/scatter.html#data-structure), and the value is a datapoint label specified by the `datapointLabels` option or a property name in case of `'json'` and `'jsonl'` data sources.

The following keys are used to indicate a special usage of the column.

- `_dataset`: This column is treated as dataset labels
- `_index`: This column is treated as index labels

In the following example, the values in the column labeled as `'month'` will be mapped to the property `x`, and the ones in the column labeled as `'value'` will be mapped to the property `y`.

```js
datapointLabelMapping: {
    _dataset: 'dataset',
    _index: 'month',
    x: 'month',
    y: 'value'
}
```

If the data source type is `'csv'`, a value can be a number instead of a label text. In that case, it indicates the column index starting with 0. If the data source type is `'sheet'`, a value can be a column-only A1 notation (for example, `'B'` indicates the second column). Below is an example of a CSV data source specifying the column index for each property in Point data.

```js
datapointLabelMapping: {
    _dataset: 0,
    _index: 1,
    x: 1,
    y: 2
}
```

## Supported Data Format

All supported data formats are listed below.

| Data<br>Source<br>Type | Format | Extension | Description
| ---------------- | ------ | --------- | -----------
| CSV | CSV | `csv` | [RFC 4180](https://www.ietf.org/rfc/rfc4180.txt)-compliant Comma-Separated Values. The default delimiter is `','`.
| CSV | TSV | `tsv` | Tab-Separated Values. The default delimiter is `'\t'`.
| CSV | PSV | `psv` | Pipe-Separated Values. The default delimiter is `'|'`.
| JSON | JSON | `json` | JSON
| JSON Lines | JSON Lines | `jsonl` | [JSON Lines](http://jsonlines.org)
| Sheet | XLSX/XLSM | `xlsx` `xlsm` | [Excel 2007+ XML Formats](https://github.com/SheetJS/js-xlsx#excel-2007-xml-xlsxxlsm)
| Sheet | XLSB BIFF12 | `xlsb` | [Excel 2007+ Binary](https://github.com/SheetJS/js-xlsx#excel-2007-binary-xlsb-biff12)
| Sheet | XML SpreadsheetML | `xml` | [Excel 2003-2004 XML Format](https://github.com/SheetJS/js-xlsx#excel-2003-2004-spreadsheetml)
| Sheet | XLS BIFF8 | `xls` | [Excel 97-2004](https://github.com/SheetJS/js-xlsx#excel-97-2004-binary-biff8)
| Sheet | XLS BIFF5 | `xls` | [Excel 5.0/95](https://github.com/SheetJS/js-xlsx#excel-20-95-biff2biff3biff4biff5)
| Sheet | XLS/XLW BIFF4 | `xls` `xlw` | [Excel 4.0](https://github.com/SheetJS/js-xlsx#excel-20-95-biff2biff3biff4biff5)
| Sheet | XLS BIFF3 | `xls` | [Excel 3.0](https://github.com/SheetJS/js-xlsx#excel-20-95-biff2biff3biff4biff5)
| Sheet | XLS BIFF2 | `xls` | [Excel 2.0/2.1](https://github.com/SheetJS/js-xlsx#excel-20-95-biff2biff3biff4biff5)
| Sheet | CSV/TXT | `csv` `txt` | [Delimiter-Separated Values](https://github.com/SheetJS/js-xlsx#delimiter-separated-values-csvtxt)
| Sheet | DIF | `dif` | [Data Interchange Format](https://github.com/SheetJS/js-xlsx#data-interchange-format-dif)
| Sheet | SYLK/SLK | `sylk` `slk` | [Symbolic Link](https://github.com/SheetJS/js-xlsx#symbolic-link-sylk)
| Sheet | PRN | `prn` | [Lotus Formatted Text](https://github.com/SheetJS/js-xlsx#lotus-formatted-text-prn)
| Sheet | TXT | `txt` | UTF-16 Unicode Text
| Sheet | ODS | `ods` | [OpenDocument Spreadsheet](https://github.com/SheetJS/js-xlsx#opendocument-spreadsheet-odsfods)
| Sheet | DODS | `fods` | [Flat XML ODF Spreadsheet](https://github.com/SheetJS/js-xlsx#opendocument-spreadsheet-odsfods)
| Sheet | 标文通 UOS1/UOS2 | `uos` | [Uniform Office Format Spreadsheet](https://github.com/SheetJS/js-xlsx#uniform-office-spreadsheet-uos12)
| Sheet | DBF | `dbf` | [dBASE II/III/IV / Visual FoxPro](https://github.com/SheetJS/js-xlsx#dbase-and-visual-foxpro-dbf)
| Sheet | WKS/WK1/WK2/WK3/WK4/123 | `wks` `wk1` `wk2` `wk3` `wk4` `123` | [Lotus 1-2-3](https://github.com/SheetJS/js-xlsx#lotus-1-2-3-wkswk1wk2wk3wk4123)
| Sheet | WQ1/WQ2/WB1/WB2/WB3/QPW | `wq1` `wq2` `wb1` `wb2` `wb3` `qpw` | [Quattro Pro Spreadsheet](https://github.com/SheetJS/js-xlsx#quattro-pro-wq1wq2wb1wb2wb3qpw)
| Sheet | HTML | `html` `htm`| [HTML Tables](https://github.com/SheetJS/js-xlsx#html)
| Sheet | ETH | `eth` | [EtherCalc Record Format](https://github.com/SheetJS/js-xlsx#ethercalc-record-format-eth)

## Cross-Origin Resource Sharing (CORS)

If your data source doesn't share the origin (domain, protocol and port) with your page, the HTTP response from the data source must include the right CORS headers to allow cross-site requests. Modern browsers handle the client-side components of cross-origin sharing, including headers and policy enforcement, and no extra code or configuration is required in your page. But, the server at the data source needs to have the proper configuration to handle requests and response headers.

Response HTTP headers must include at least the following header, which indicates that requests from this origin will be allowed.

```
Access-Control-Allow-Origin: [<scheme>:]<domain>[:<port>]
```

The value can also be `*` which means that the resource can be accessed by any domain in a cross-site manner.

```
Access-Control-Allow-Origin: *
```

See [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) for more details.

## Building

You first need to install node dependencies (requires [Node.js](https://nodejs.org/)):

```bash
npm install
```

The following commands will then be available from the repository root:

```bash
gulp build            # build dist files
gulp build --watch    # build and watch for changes
gulp lint             # perform code linting
gulp package          # create an archive with dist files and samples
```

## License

chartjs-plugin-datasource is available under the [MIT license](https://opensource.org/licenses/MIT).
