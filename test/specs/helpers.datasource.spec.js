import datasourceHelpers from '../../src/helpers/helpers.datasource';

describe('helpers.datasource', function() {
	describe('getExtension', function() {
		it('should return an extension', function() {
			var getExtension = datasourceHelpers.getExtension;

			expect(getExtension('file.csv')).toBe('csv');
			expect(getExtension('file.1.csv')).toBe('csv');
			expect(getExtension('file.csv?query.string')).toBe('csv');
			expect(getExtension('file.csv#fragment.string')).toBe('csv');
			expect(getExtension('./file.csv')).toBe('csv');
			expect(getExtension('http://host.domain/path/to/file.csv')).toBe('csv');
		});

		it('should return undefined if no extestion is contained', function() {
			var getExtension = datasourceHelpers.getExtension;

			expect(getExtension('file')).toBeUndefined();
			expect(getExtension('file?query.string')).toBeUndefined();
			expect(getExtension('file#fragment.string')).toBeUndefined();
			expect(getExtension('http://host.domain/path/to/file')).toBeUndefined();
		});
	});

	describe('transpose', function() {
		it('should return a transposed array', function() {
			var transpose = datasourceHelpers.transpose;

			expect(transpose([])).toEqual([[]]);
			expect(transpose([[]])).toEqual([[]]);
			expect(transpose([[1]])).toEqual([[1]]);
			expect(transpose([[1, 2], [3, 4]])).toEqual([[1, 3], [2, 4]]);
			expect(transpose([[1, 2, 3], [4, 5, 6]])).toEqual([[1, 4], [2, 5], [3, 6]]);
			expect(transpose([['1', '2', '3'], ['4', '5', '6']])).toEqual([['1', '4'], ['2', '5'], ['3', '6']]);
		});
	});

	describe('dedup', function() {
		it('should return a deduped array', function() {
			var dedup = datasourceHelpers.dedup;

			expect(dedup([])).toEqual([]);
			expect(dedup([1, 2, 3])).toEqual([1, 2, 3]);
			expect(dedup([1, 1, 2, 2, 2, 3])).toEqual([1, 2, 3]);
			expect(dedup([1, 3, 2, 1, 2, 2])).toEqual([1, 3, 2]);
			expect(dedup(['1', '1', '2', '2', '2', '3'])).toEqual(['1', '2', '3']);
			expect(dedup([1, undefined, 2, undefined, 3])).toEqual([1, undefined, 2, 3]);
		});
	});
});
