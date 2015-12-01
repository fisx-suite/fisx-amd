/**
 * @file 模块代码资源 id 更新
 * @author sparklewhy@gmail.com
 */

var estraverse = require('estraverse');
var constant = require('./constant');
var amdHelper = require('./module-helper');
var parseModule = require('./module-parser');
var codeGenerator = require('./code-generator');

var SYNTAX = estraverse.Syntax;
var LITERAL_REQUIRE = constant.REQUIRE;

function updateDepInfo(dependencies, moduleInfo, resourceReplacer, isAsynDep) {
    if (!dependencies) {
        return;
    }

    for (var i = 0, len = dependencies.length; i < len; i++) {
        var depId = dependencies[i];
        dependencies[i] = resourceReplacer(depId, moduleInfo, isAsynDep);
    }
}

function updateDefineFactoryInfo(factoryAst, moduleInfo, resourceReplacer) {
    estraverse.traverse(factoryAst, {
        enter: function (item) {
            if (item.type !== SYNTAX.CallExpression) {
                return;
            }

            var arg0;
            if (item.callee.name === LITERAL_REQUIRE
                && (arg0 = item.arguments[0])
                && arg0.type === SYNTAX.Literal
                && typeof arg0.value === 'string'
            ) {
                var resId = arg0.value;
                arg0.value = resourceReplacer(resId, moduleInfo);
                arg0.raw = '\'' + arg0.value + '\'';
            }
        }
    });
}

/**
 * 处理一个模块的资源引用替换
 *
 * @inner
 * @param {Object} moduleInfo 模块信息对象
 * @param {Function} resourceReplacer 资源id替换函数
 * @return {Object}
 */
function processModuleReplace(moduleInfo, resourceReplacer) {
    // 替换依赖的模块资源 id 信息
    updateDepInfo(moduleInfo.defineDeps, moduleInfo, resourceReplacer);
    updateDepInfo(moduleInfo.syncDeps, moduleInfo, resourceReplacer);
    updateDepInfo(moduleInfo.asynDeps, moduleInfo, resourceReplacer, true);

    // 替换 factory 方法用到的模块资源 id 信息
    var factoryAst = moduleInfo.factoryAst;
    if (factoryAst.type === SYNTAX.FunctionExpression) {
        updateDefineFactoryInfo(factoryAst, moduleInfo, resourceReplacer);
    }

    return moduleInfo;
}

/**
 * 更新资源 id 信息
 *
 * @param {string} code 要更新的代码
 * @param {function(string, Object):string} resourceReplacer 自定义的资源替换方法
 * @return {string} 更新后的代码
 */
exports.updateResourceId = function (code, resourceReplacer) {
    var ast = amdHelper.getAst(code);
    if (!ast) {
        return code;
    }

    var moduleInfo = parseModule(ast);
    if (!moduleInfo) {
        return code;
    }

    if (!Array.isArray(moduleInfo)) {
        moduleInfo = [moduleInfo];
    }

    // 处理模块替换
    moduleInfo.forEach(function (item, index) {
        moduleInfo[index] = processModuleReplace(item, resourceReplacer);
    });

    return codeGenerator.generateModuleCode(moduleInfo, ast);
};
