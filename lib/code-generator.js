/**
 * @file 代码生成器
 * @author leeight
 *         sparklewhy@gmail.com
 */

var escodegen = require('escodegen');
var estraverse = require('estraverse');
var util = require('./util');
var constant = require('./constant');
var SYNTAX = require('estraverse').Syntax;
var LITERAL_DEFINE = constant.DEFINE;


/**
 * 根据模块信息生成 AST
 *
 * @inner
 * @param {Object} moduleInfo 模块信息
 * @return {Object}
 */
function generateModuleAst(moduleInfo) {
    var dependenciesExpr;
    var syncDeps = moduleInfo.syncDeps;
    var defineDeps = (moduleInfo.defineDeps || []).slice(0);
    var factoryParamCount = moduleInfo.factoryParamCount;

    if (syncDeps instanceof Array) {
        dependenciesExpr = {
            type: SYNTAX.ArrayExpression,
            elements: []
        };

        // 去除重复的依赖声明：define(['a', 'a', 'a'], function (a){})
        // => define(['a'], function (a))
        var validDeps = util.deduplication(defineDeps, factoryParamCount);
        validDeps.concat(util.removeExisted(syncDeps, validDeps)).forEach(
            function (dependency) {
                dependenciesExpr.elements.push({
                    type: SYNTAX.Literal,
                    value: dependency,
                    raw: '\'' + dependency + '\''
                });
            }
        );
    }

    var defineArgs = [moduleInfo.factoryAst];
    if (dependenciesExpr) {
        defineArgs.unshift(dependenciesExpr);
    }
    var id = moduleInfo.id;
    if (id) {
        defineArgs.unshift({
            type: SYNTAX.Literal,
            value: moduleInfo.id,
            raw: '\'' + moduleInfo.id + '\''
        });
    }

    return {
        type: SYNTAX.CallExpression,
        callee: {
            type: SYNTAX.Identifier,
            name: LITERAL_DEFINE
        },
        arguments: defineArgs
    };
}

/**
 * 生成模块代码
 *
 * @param {Object|Array.<Object>} moduleInfo 模块信息，结构参考 {@link lib/module-parser}
 * @param {Object=} sourceAst 源文件的AST，可选
 * @return {string}
 */
exports.generateModuleCode = function (moduleInfo, sourceAst) {
    if (!(moduleInfo instanceof Array)) {
        moduleInfo = [moduleInfo];
    }

    var ast;
    // 如果没有原始的 ast ，则按照 moduleInfo 来生成代码
    if (!sourceAst) {
        ast = {
            type: SYNTAX.Program,
            body: []
        };

        moduleInfo.forEach(function (item) {
            ast.body.push({
                type: SYNTAX.ExpressionStatement,
                expression: generateModuleAst(item)
            });
        });
    }
    // 有原始 ast，则对原始 ast 中 module 定义的部分进行替换
    else {
        var i = 0;
        ast = estraverse.replace(sourceAst, {
            enter: function (node) {
                if (node.type === SYNTAX.CallExpression
                    && node.callee.name === LITERAL_DEFINE
                    && moduleInfo[i]
                ) {
                    return generateModuleAst(moduleInfo[i++]);
                }
            }
        });
    }

    return escodegen.generate(ast);
};
