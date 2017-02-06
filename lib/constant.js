/**
 * @file 一些常量定义
 * @author sparklewhy@gmail.com
 */

/**
 * `define` 常量
 *
 * @type {string}
 * @const
 */
exports.DEFINE = 'define';

/**
 * `require` 常量
 *
 * @type {string}
 * @const
 */
exports.REQUIRE = 'require';

/**
 * 模块后缀名
 *
 * @type {string}
 * @const
 */
exports.MODULE_EXTNAME = '.js';

/**
 * 模块扩展名正则
 *
 * @type {RegExp}
 * @const
 */
exports.MODULE_EXTNAME_REGEXP = /\.js$/i;

/**
 * AMD 模块内建的模块
 *
 * @type {Array.<string>}
 * @const
 */
exports.BUILTIN_MODULES = ['require', 'exports', 'module'];
