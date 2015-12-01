/**
 * @file path 相关工具方法
 * @author sparklewhy@gmail.com
 */

var path = require('path');

module.exports = exports = {};

/**
 * 对给定路径进行规范化，统一用 `/` 方式
 *
 * @inner
 * @param {string} sourcePath 要规范化的路径
 * @return {string}
 */
function normalize(sourcePath) {
    return sourcePath.replace(/\\/g, '/');
}

['normalize', 'join', 'resolve', 'relative', 'dirname'].forEach(
    function (method) {
        exports[method] = function () {
            // 避免 windows/*unix 路径风格不统一，这里统一用 `/`
            return normalize(
                path[method].apply(path, arguments)
            );
        };
    }
);

exports.extname = path.extname.bind(path);

/**
 * 判断给定 url 是否是绝对的 url
 *
 * @param {string} url 要判断的 url
 * @return {boolean}
 */
exports.isAbsoluteURL = function (url) {
    return /^[a-z][a-z0-9\+\-\.]+:/i.test(url);
};

/**
 * 判断给定的路径是不是本地路径
 *
 * @param {string} filePath 要判断的文件路径
 * @return {boolean}
 */
exports.isLocalPath = function (filePath) {
    return !(/^\/\//.test(filePath) || exports.isAbsoluteURL(filePath));
};
