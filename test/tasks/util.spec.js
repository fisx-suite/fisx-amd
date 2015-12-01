var expect = require('expect.js');
var util = require('../../lib/util');

describe('util - deduplication', function () {
    it('should remove repeated items', function () {
        expect(util.deduplication([2, 3, 5, 6, 5])).to.eql([2, 3, 5, 6]);
        expect(util.deduplication([2, 3, 5, 6, 5], 3)).to.eql([2, 3, 5, 6]);
        expect(util.deduplication([2, 3, 5, 6, 15], 3)).to.eql([2, 3, 5, 6, 15]);
        expect(util.deduplication([5, 3, 5, 6, 5], 3)).to.eql([5, 3, 5, 6]);
        expect(util.deduplication([])).to.eql([]);
        expect(util.deduplication([5, 3, 5, 6, 5], 0)).to.eql([5, 3, 6]);
        expect(util.deduplication([5, 3, 5, 6, 5], 5)).to.eql([5, 3, 5, 6, 5]);
    });
});
