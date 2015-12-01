var expect = require('expect.js');
var parser = require('../../lib/module-parser');

describe('module parser', function () {

    it('should return async module info', function () {
        var result = parser('require([ \'er\' ]); // xx', true);
        expect(result.asynDeps).to.eql(['er']);
    });

    it('should return undefined module info', function () {
        var result = parser('require([ \'er\' ]); // xx');
        expect(result).to.eql(undefined);
    })
});
