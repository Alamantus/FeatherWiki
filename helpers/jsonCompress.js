// A modified version of https://github.com/Alamantus/JSON-Compress that
// only includes what is used in Feather Wiki (i.e. compress & decompress)
// and replaces some workarounds with ES6 options

var _nCode = -1;

/**
 * Compress a RAW JSON
 * @param json
 * @param optKeys
 * @param checkForCollision
 * @returns {*}
 */
 export function compress (json, optKeys, checkForCollision) {
  if (typeof optKeys === 'boolean') {
    checkForCollision = optKeys;
    optKeys = undefined;
  } else {
    checkForCollision = typeof checkForCollision !== 'undefined' ? checkForCollision : false;
  }
  if (typeof optKeys === 'undefined') {
    _nCode = -1;
  }
  var aKeys = optKeys || [],
    obj;

  if (_isArray(json)) {
    _compressArray(json, aKeys, checkForCollision);
    obj = json;
  }
  else {
    obj = _compressOther(json, aKeys, checkForCollision);
  }
  return obj;
};

/**
 * Decompress a compressed JSON
 * @param json
 * @returns {*}
 */
export function decompress (json) {
  var str,
    jsonCopy = JSON.parse(JSON.stringify(json));
  if (_isArray(jsonCopy)) {
    _decompressArray(jsonCopy);
  }
  else {
    str = _decompressOther(jsonCopy);
  }
  return str ? JSON.parse(str) : jsonCopy;
};

/**
 * Checks if the value exist in the array.
 * @param arr
 * @param v
 * @returns {boolean}
 */
 function contains(arr, v) {
  var nIndex,
    nLen = arr.length;
  for (nIndex = 0; nIndex < nLen; nIndex++) {
    if (arr[nIndex][1] === v) {
      return true;
    }
  }
  return false;
}

/**
 * Removes duplicated values in an array
 * @param oldArray
 * @returns {Array}
 */
 function unique(oldArray) {
  var nIndex,
    nLen = oldArray.length,
    aArr = [];
  for (nIndex = 0; nIndex < nLen; nIndex++) {
    if (!contains(aArr, oldArray[nIndex][1])) {
      aArr.push(oldArray[nIndex]);
    }
  }
  return aArr;
}

/**
 * Escapes a RegExp
 * @param text
 * @returns {*}
 */
function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Returns if the obj is an object or not.
 * @param obj
 * @returns {boolean}
 * @private
 */
function _isObject(obj) {
  return obj?.constructor === Object;
}

/**
 * Returns if the obj is an array or not
 * @param obj
 * @returns {boolean}
 * @private
 */
function _isArray(obj) {
  return Array.isArray(obj);
}

/**
 * Converts a bidimensional array to object
 * @param aArr
 * @returns {{}}
 * @private
 */
function _biDimensionalArrayToObject(aArr) {
  return aArr.reduce((result, current) => {
    result[current[0]] = current[1];
    return result;
  }, {});
}

/**
 * Convert a number to their ascii code/s.
 * @param index
 * @param totalChar
 * @param offset
 * @returns {Array}
 * @private
 */
function _numberToKey(index, totalChar, offset = 0) {
  var sKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=_!?()*',
    aArr = [],
    currentChar = index;
  totalChar = totalChar || sKeys.length;
  while (currentChar >= totalChar) {
    aArr.push(sKeys.charCodeAt((currentChar % totalChar) + offset));
    currentChar = Math.floor(currentChar / totalChar - 1);
  }
  aArr.push(sKeys.charCodeAt(currentChar + offset));
  return aArr.reverse();
}

/**
 * Returns the string using an array of ASCII values
 * @param aKeys
 * @returns {string}
 * @private
 */
function _getSpecialKey(aKeys) {
  return String.fromCharCode.apply(String, aKeys);
}

/**
 * Traverse all the objects looking for keys and set an array with the new keys
 * @param json
 * @param aKeys
 * @returns {*}
 * @private
 */
function _getKeys(json, aKeys) {
  var aKey,
    sKey,
    oItem;

  for (sKey in json) {

    if (typeof json[sKey] !== 'undefined') {
      oItem = json[sKey];
      if (_isObject(oItem) || _isArray(oItem)) {
        aKeys = aKeys.concat(unique(_getKeys(oItem, aKeys)));
      }
      if (isNaN(Number(sKey))) {
        if (!contains(aKeys, sKey)) {
          _nCode += 1;
          aKey = [_getSpecialKey(_numberToKey(_nCode)), sKey];
          aKeys.push(aKey);
        }
      }
    }
  }
  return aKeys;
}

/**
 * Method to prevent key values from being overridden if matched by compressed key
 * @private
 * @param aKeys
 */
function _correctCollision(aKeys) {
  var nIndex,
    nLen = aKeys.length,
    cKeys = {};
  for (nIndex = 0; nIndex < nLen; nIndex++) {
    var aKey = aKeys[nIndex][0];
    cKeys[aKey] = nIndex;
  }
  for (nIndex = 0; nIndex < nLen; nIndex++) {
    var aVal = aKeys[nIndex][1];
    if (typeof cKeys[aVal] !== 'undefined') {
      var cIndex = cKeys[aVal];
      _nCode += 1;
      aKeys[cIndex][0] = _getSpecialKey(_numberToKey(_nCode));
      cKeys[cIndex] = aKeys[cIndex][0];
      delete cKeys[aVal];
      return _correctCollision(aKeys);
    }
  }
  return aKeys;
}

/**
 * Method to compress array objects
 * @private
 * @param json
 * @param aKeys
 * @param checkForCollision
 */
function _compressArray(json, aKeys, checkForCollision) {
  var nIndex,
    nLenKeys;

  for (nIndex = 0, nLenKeys = json.length; nIndex < nLenKeys; nIndex++) {
    json[nIndex] = compress(json[nIndex], aKeys, checkForCollision);
  }
}

/**
 * Method to compress anything but array
 * @private
 * @param json
 * @param aKeys
 * @param checkForCollision
 * @returns {*}
 */
function _compressOther(json, aKeys, checkForCollision) {
  var aKey,
    str,
    nLenKeys,
    nIndex,
    obj;
  aKeys = unique(_getKeys(json, aKeys));
  if (checkForCollision === true) {
    aKeys = _correctCollision(aKeys);
  }

  str = JSON.stringify(json);
  nLenKeys = aKeys.length;

  for (nIndex = 0; nIndex < nLenKeys; nIndex++) {
    aKey = aKeys[nIndex];
    str = str.replace(new RegExp('(?:"' + escapeRegExp(aKey[1]) + '"):', 'g'), '"' + aKey[0] + '":');
  }
  obj = JSON.parse(str);
  obj._ = _biDimensionalArrayToObject(aKeys);
  return obj;
}

/**
 * Method to decompress array objects
 * @private
 * @param json
 */
function _decompressArray(json) {
  var nIndex, nLenKeys;

  for (nIndex = 0, nLenKeys = json.length; nIndex < nLenKeys; nIndex++) {
    json[nIndex] = decompress(json[nIndex]);
  }
}

/**
 * Method to decompress anything but array
 * @private
 * @param jsonCopy
 * @returns {*}
 */
function _decompressOther(jsonCopy) {
  var oKeys, str, sKey;

  oKeys = JSON.parse(JSON.stringify(jsonCopy._));
  delete jsonCopy._;
  str = JSON.stringify(jsonCopy);
  for (sKey in oKeys) {
    if (typeof oKeys[sKey] !== 'undefined') {
      str = str.replace(new RegExp('(?:"' + sKey + '"):', 'g'), '"' + oKeys[sKey] + '":');
    }
  }
  return str;
}
