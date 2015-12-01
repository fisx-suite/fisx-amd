var expect = require('expect.js');
var helper = require('../../lib/module-helper');

describe('module-helper - resolve moudule id', function () {
    it('should return absolute moudle id', function () {
        expect(helper.resolveModuleId('../a/b', 'c/d')).to.eql('a/b');
        expect(helper.resolveModuleId('../../a/b', 'c/d')).to.eql('../a/b');
        expect(helper.resolveModuleId('a/b', 'c/d')).to.eql('a/b');
        expect(helper.resolveModuleId('./../a/b', 'c/d')).to.eql('a/b');
        expect(helper.resolveModuleId('./.././a/b', 'c/d')).to.eql('a/b');
        expect(helper.resolveModuleId('./.././../a/b', 'c/d')).to.eql('../a/b');
        expect(helper.resolveModuleId('./a/b', 'c/d')).to.eql('c/a/b');
        expect(helper.resolveModuleId('../../../a/b', 'c/d')).to.eql('../../a/b');
        expect(helper.resolveModuleId('./a/b', '/c/d')).to.eql('/c/a/b');
        expect(helper.resolveModuleId('/a/b', 'c/d')).to.eql('/a/b');
        expect(helper.resolveModuleId('//a/b', 'c/d')).to.eql('//a/b');
        expect(helper.resolveModuleId('./a/b', 'c')).to.eql('a/b');
        expect(helper.resolveModuleId('../a/b', 'c')).to.eql('../a/b');
        expect(helper.resolveModuleId('./a/b.js', 'c/d')).to.eql('c/a/b.js');
        expect(helper.resolveModuleId('./a/b.js?a=3', 'c/d')).to.eql('c/a/b.js?a=3');
    });
});
