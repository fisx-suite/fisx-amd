/**
 * @file 模块资源处理的相关助手方法
 * @author sparklewhy@gmail.com
 */

var path = require('./path');
var util = require('./util');
var constant = require('./constant');
var assign = require('object-assign');

module.exports = exports = {};

/**
 * 获取给定代码的抽象语法树
 *
 * @param {string} code js 代码
 * @param {Object=} options 选项
 *        具体参考 http://esprima.org/doc/index.html
 * @return {?Object}
 */
exports.getAst = function (code, options) {
    var ast;

    try {
        ast = require('esprima').parse(
            code,
            assign({attachComment: true}, options || {})
        );
    }
    catch (ex) {
        console.error('parse code: \n%s', code);
        console.error(ex.stack);
    }

    return ast;
};

/**
 * 将相对的 module id 转换成绝对 id
 *
 * @param {string} id 要转换的 id
 * @param {string} baseId 基础 id
 * @return {string}
 */
exports.resolveModuleId = function (id, baseId) {
    if (/^\./.test(id) && baseId) {
        return path.join(path.dirname(baseId), id);
    }
    return id;
};

/**
 * 获取给定的资源信息
 *
 * @inner
 * @param {string} resId 要获取的资源 id
 * @param {string} ownerId 加载该资源的模块 id
 * @param {Object} moduleConfig 模块的配置
 * @param {Array.<Object>=} mapConfigs map 配置，可选，该配置基于
 *                         {@link util.createKVSortedIndex} 生成
 * @return {{id: string, extname: string, query: string, path: string}}
 */
function getResourceInfo(resId, ownerId, moduleConfig, mapConfigs) {
    var extReg = /(\.[a-z0-9]+)$/i;
    var queryReg = /(\?[^#]*)$/;
    var extname = '';
    var query = '';
    var id = resId;
    if (queryReg.test(id)) {
        query = RegExp.$1;
        id = id.replace(queryReg, '');
    }

    if (extReg.test(resId)) {
        extname = RegExp.$1;
        id = id.replace(extReg, '');
    }

    if (ownerId) {
        id = exports.resolveModuleId(id, ownerId);
    }

    if (mapConfigs && ownerId) {
        id = exports.findRequireMapModule(mapConfigs, ownerId, id);
    }

    var file = exports.getModuleFile(id, moduleConfig, extname);
    var relativePath = file && (file = path.relative(moduleConfig.root, file));
    return {
        rawId: resId,
        id: id,
        extname: extname,
        query: query,
        path: relativePath,
        fullPath: file
    };
}

/**
 * 获取给定的资源 id 信息
 *
 * @param {string} resId 资源 id
 * @param {string} ownerId 加载该资源的模块 id
 * @param {string} moduleConfig 模块配置
 * @param {Array.<Object>=} mapConfigs map 配置，可选，该配置基于
 *                         {@link util.createKVSortedIndex} 生成
 * @return {{module: Object, pluginResource: ?Object}}
 */
exports.getResourceInfo = function (resId, ownerId, moduleConfig, mapConfigs) {
    var parts = resId.split('!');
    var moduleId = parts.shift();
    var pluginResourceId = parts.join('!');

    return {
        module: getResourceInfo(moduleId, ownerId, moduleConfig, mapConfigs),
        pluginResource: pluginResourceId
            && getResourceInfo(pluginResourceId, ownerId, moduleConfig, mapConfigs)
    };
};

/**
 * 获取资源的 id，返回结果形如：`src/a/b.tpl`
 *
 * @param {string} resFile 资源文件路径
 * @param {string} moduleConfig 模块配置
 * @param {boolean=} withExtname 是否包含后缀名，可选，默认 false
 * @return {string}
 */
exports.getResourceId = function (resFile, moduleConfig, withExtname) {
    var id = path.relative(
        path.resolve(moduleConfig.root, moduleConfig.baseUrl),
        path.resolve(moduleConfig.root, resFile)
    );

    if (withExtname) {
        return id;
    }

    return id.substring(0, id.lastIndexOf(path.extname(id)));
};

/**
 * 预处理模块的配置，主要针对 package 的配置的 main 值包含后缀的情况进行移除
 *
 * @param {Object} moduleConfig 模块的配置
 * @param {string} root 模块所在项目根目录
 * @return {Object}
 */
exports.initModuleConfig = function (moduleConfig, root) {
    var conf = assign({}, moduleConfig || {});
    conf.root = root;
    var packages = conf.packages || [];
    for (var i = 0, len = packages.length; i < len; i++) {
        var pkg = assign({}, packages[i]);
        var pkgMain = pkg.main;
        if (pkgMain) {
            pkg.main = pkgMain.replace(/\.js$/i, '');
        }
    }

    return conf;
};

/**
 * 根据模块文件路径获取模块可能的 module id
 * TODO 模块文件本身就是具名模块处理以及多 define 情况
 *
 * @param {string} moduleFile 模块文件路径
 * @param {string} moduleConfig 模块配置
 * @param {boolean=} returnDefault 是否返回默认的 模块 id，可选，默认返回所有可能的 模块 id
 * @return {Array.<string>}
 */
exports.getModuleId = function (moduleFile, moduleConfig, returnDefault) {
    var root = moduleConfig.root;
    var moduleFilePath = path.resolve(root, moduleFile.replace(/\.js$/, ''));
    var basePath = path.resolve(root, moduleConfig.baseUrl);

    var moduleIds = [];
    var addedIdMap = {};
    function addModuleId(moduleId) {
        if (!addedIdMap[moduleId]) {
            addedIdMap[moduleId] = 1;
            moduleIds.push(moduleId);
        }
    }

    // 通过 packages 配置项，查找可能的模块 id 映射到给定的模块路径
    var hasPkgModuleId = false;
    var packages = moduleConfig.packages || [];
    for (var i = 0, len = packages.length; i < len; i++) {
        var pkg = packages[i];
        var pkgName = pkg.name;
        var pkgMain = pkg.main || 'main';
        var pkgDir = pkg.location || pkgName;

        if (path.isAbsoluteURL(pkgDir)) {
            continue;
        }

        pkgDir = path.resolve(basePath, pkgDir);
        if (moduleFilePath.indexOf(pkgDir + '/') === 0) {
            hasPkgModuleId = true;

            // 添加形如 `er/main` 模块 id，这里先添加为了保证返回默认 模块 id 不会是包名。。
            addModuleId(pkgName + moduleFilePath.replace(pkgDir, ''));

            // require('er') 映射到的模块路径为 base + pkgDir + pkgMain
            // 包名 作为 模块 id 添加
            if (moduleFilePath === pkgDir + '/' + pkgMain) {
                addModuleId(pkgName);
            }
        }
    }

    // 根据 paths 配置查找可能的的模块 id 映射到给定的模块路径
    var paths = moduleConfig.paths || {};
    var pathKeys = Object.keys(paths);
    pathKeys.sort(function (a, b) {
        return paths[b].length - paths[a].length;
    });
    for (i = 0, len = pathKeys.length; i < len; i++) {
        var key = pathKeys[i];
        var value = paths[key];

        if (path.isAbsoluteURL(value)) {
            continue;
        }

        value = path.resolve(basePath, value);
        if ((new RegExp('^' + value + '(/|$)')).test(moduleFilePath)) {
            var moduleId = moduleFilePath.replace(value, key);
            addModuleId(moduleId);
        }
    }

    // 计算相对于 baseUrl 的模块 id
    var defaultModuleId;
    if (!hasPkgModuleId && moduleFilePath.indexOf(basePath + '/') === 0) {
        defaultModuleId = moduleFilePath.replace(basePath + '/', '');
        addModuleId(defaultModuleId);
    }

    if (!moduleIds.length) {
        moduleIds[0] = path.relative(basePath, moduleFilePath);
    }

    if (returnDefault) {
        return defaultModuleId || moduleIds[0];
    }

    return moduleIds;
};

/**
 * 获取 module 文件路径
 *
 * @param {string} moduleId 查找的模块 id
 * @param {Object} moduleConfig 模块配置
 * @param {string=} extname 文件后缀名，可选，默认 `.js`
 * @return {?string}
 */
exports.getModuleFile = function (moduleId, moduleConfig, extname) {
    if (constant.BUILTIN_MODULES.indexOf(moduleId) !== -1) {
        return null;
    }

    var root = moduleConfig.root;
    var baseUrl = moduleConfig.baseUrl;
    extname || (extname = constant.MODULE_EXTNAME);

    // 按照 packages 的配置查找
    var packages = moduleConfig.packages || [];
    for (var i = 0, len = packages.length; i < len; i++) {
        var pkg = packages[i];
        var pkgName = pkg.name;

        if (moduleId.split('/')[0] === pkgName) {
            var pkgDir = pkg.location || pkgName;
            if (path.isAbsoluteURL(pkgDir)) {
                return null;
            }

            if (moduleId === pkgName) {
                moduleId += '/' + (pkg.main || 'main');
            }
            moduleId = moduleId.replace(pkgName, '.');
            return path.resolve(root, baseUrl, pkgDir, moduleId) + extname;
        }
    }

    // 按照 paths 配置查找
    var pathMaps = util.createKVSortedIndex(moduleConfig.paths || {});
    for (i = 0, len = pathMaps.length; i < len; i++) {
        var item = pathMaps[i];
        if (item.reg.test(moduleId)) {
            var modulePath = item.v;
            if (path.isAbsoluteURL(modulePath)) {
                return null;
            }

            moduleId = moduleId.replace(item.k, '.');
            return path.resolve(root, baseUrl, modulePath, moduleId) + extname;
        }
    }

    return path.resolve(root, baseUrl, moduleId) + extname;
};

/**
 * 根据给定的包名查找 package 配置
 *
 * @param {string} name 要查找的包的名称
 * @param {Object} moduleConfig 模块的配置
 * @return {?Object}
 */
exports.findPkgConfig = function (name, moduleConfig) {
    var packages = moduleConfig.packages || [];
    for (var i = 0, len = packages.length; i < len; i++) {
        var pkg = packages[i];
        var pkgName = pkg.name;

        if (name === pkgName) {
            var pkgMain = pkg.main || 'main';
            return {
                name: pkgName,
                location: pkg.location,
                main: pkgMain,
                entryModuleId: pkgName + '/' + pkgMain
            };
        }
    }
};

/**
 * 根据给定的 map 配置查询给定的模块加载的模块 id 的真实要加载的模块 id
 *
 * @param {Array.<Object>} mapConfigs map 配置，该配置基于
 *                         {@link util.createKVSortedIndex} 生成
 * @param {string} moduleId 加载依赖模块的模块 id
 * @param {string} depId 要确定的真实加载的依赖 绝对模块 id
 * @return {string}
 */
exports.findRequireMapModule = function (mapConfigs, moduleId, depId) {
    for (var i = 0, len = mapConfigs.length; i < len; i++) {
        var item = mapConfigs[i];
        if (!item.reg.test(moduleId)) {
            continue;
        }

        var value = item.v;
        for (var j = 0, jLen = value.length; j < jLen; j++) {
            if (value[j].reg.test(depId)) {
                return depId.replace(value[j].k, value[j].v);
            }
        }
    }

    return depId;
};

/**
 * 判断给定的模块 id 是否是内建模块
 *
 * @param {string} moduleId 模块 id
 * @return {boolean}
 */
exports.isBuitlinModule = function (moduleId) {
    return constant.BUILTIN_MODULES.indexOf(moduleId) !== -1;
};
