/**
 * @file 工具方法
 * @author sparklewhy@gmail.com
 */


module.exports = exports = {};

/**
 *  从全集移除已经存在的集合中的元素
 *
 * @param {Array.<string>} all 全部的集合
 * @param {Array.<string>} existeds 已经存在的集合
 * @return {Array.<string>}
 */
exports.removeExisted = function (all, existeds) {
    var index = {};
    existeds.forEach(function (item) {
        index[item] = 1;
    });

    var result = [];
    var addedMap = {};
    all.forEach(function (item) {
        if (!index[item] && !addedMap[item]) {
            result.push(item);
            addedMap[item] = 1;
        }
    });

    return result;
};

/**
 * 对于给定的集合去除重复的
 *
 * @param {Array} list 数据集合
 * @param {number=} start 开始去重的子集的开始索引位置
 * @return {Array}
 */
exports.deduplication = function (list, start) {
    start || (start = 0);
    var end = list.length;
    if (start >= end - 1) {
        return list;
    }

    var result = list.slice(0, start);
    for (var i = start, len = end; i < len; i++) {
        var item = list[i];
        if (result.indexOf(item) === -1) {
            result.push(item);
        }
    }

    return result;
};

/**
 * 根据元素的k或name项进行数组字符数逆序的排序函数
 *
 * @inner
 * @param {Object} a 要比较的对象a
 * @param {Object} b 要比较的对象b
 * @return {number} 比较结果
 */
function descSorterByKOrName(a, b) {
    var aValue = a.k || a.name;
    var bValue = b.k || b.name;

    if (bValue === '*') {
        return -1;
    }

    if (aValue === '*') {
        return 1;
    }

    return bValue.length - aValue.length;
}

/**
 * 将key为module id prefix的Object，生成数组形式的索引，并按照长度和字面排序
 *
 * @param {Object} value 源值
 * @param {boolean=} allowAsterisk 是否允许 * 号表示匹配所有，默认不允许
 * @return {Array} 索引对象
 */
exports.createKVSortedIndex = function (value, allowAsterisk) {
    var index = exports.kv2List(value, true, allowAsterisk);
    index.sort(descSorterByKOrName);
    return index;
};

/**
 * 创建id前缀匹配的正则对象
 *
 * @inner
 * @param {string} prefix id前缀
 * @return {RegExp} 前缀匹配的正则对象
 */
function createPrefixRegexp(prefix) {
    return new RegExp('^' + prefix + '(/|$)');
}

/**
 * 将对象数据转换成数组，数组每项是带有k和v的Object
 *
 * @param {Object} source 对象数据
 * @param {boolean} keyMatchable key是否允许被前缀匹配
 * @param {boolean} allowAsterisk 是否支持*匹配所有
 * @return {Array.<Object>} 对象转换数组
 */
exports.kv2List = function (source, keyMatchable, allowAsterisk) {
    var list = [];
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            var item = {
                k: key,
                v: source[key]
            };
            list.push(item);

            if (keyMatchable) {
                item.reg = key === '*' && allowAsterisk
                    ? /^/
                    : createPrefixRegexp(key);
            }
        }
    }

    return list;
};
