/**
 * @file fisx-amd 主模块
 * @author sparklewhy@gmail.com
 */

var util = require('./lib/util');
for (var k in util) {
    if (util.hasOwnProperty(k)) {
        exports[k] = util[k];
    }
}

var pathUtil = require('./lib/path');
for (k in pathUtil) {
    if (pathUtil.hasOwnProperty(k)) {
        exports[k] = pathUtil[k];
    }
}

var helper = require('./lib/module-helper');
for (k in helper) {
    if (helper.hasOwnProperty(k)) {
        exports[k] = helper[k];
    }
}

exports.parseAMDModule = require('./lib/module-parser');

exports.generateModuleCode = require('./lib/code-generator').generateModuleCode;

exports.updateResourceId = require('./lib/module-updater').updateResourceId;

/**
 * 查询模块文件
 *
 * @param {string} moduleId 模块 id
 * @param {string} ownerId 加载该模块所属文件模块 id
 * @param {Object} moduleConf 模块配置
 * @param {Object} fis fis 实例
 * @return {Object}
 */
exports.lookupModuleFile = function (moduleId, ownerId, moduleConf, fis) {
    var moduleInfo = exports.getResourceInfo(moduleId, ownerId, moduleConf).module;
    if (moduleInfo.fullPath && fis.util.isAbsolute(moduleInfo.fullPath)) {
        return fis.project.lookup(moduleInfo.fullPath);
    }
    return {};
};

