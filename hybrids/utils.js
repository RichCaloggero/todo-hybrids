function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var camelToDashMap = new Map();
export function camelToDash(str) {
  var result = camelToDashMap.get(str);

  if (result === undefined) {
    result = str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    camelToDashMap.set(str, result);
  }

  return result;
}
export function pascalToDash(str) {
  return camelToDash(str.replace(/((?!([A-Z]{2}|^))[A-Z])/g, "-$1"));
}
export function dispatch(host, eventType) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return host.dispatchEvent(new CustomEvent(eventType, _objectSpread({
    bubbles: false
  }, options)));
}
export function shadyCSS(fn, fallback) {
  var shady = window.ShadyCSS;
  /* istanbul ignore next */

  if (shady && !shady.nativeShadow) {
    return fn(shady);
  }

  return fallback;
}
export function stringifyElement(target) {
  return "<".concat(String(target.tagName).toLowerCase(), ">");
}
export var IS_IE = ("ActiveXObject" in window);
export var deferred = Promise.resolve();
export var storePointer = new WeakMap();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy5qcyJdLCJuYW1lcyI6WyJjYW1lbFRvRGFzaE1hcCIsIk1hcCIsImNhbWVsVG9EYXNoIiwic3RyIiwicmVzdWx0IiwiZ2V0IiwidW5kZWZpbmVkIiwicmVwbGFjZSIsInRvTG93ZXJDYXNlIiwic2V0IiwicGFzY2FsVG9EYXNoIiwiZGlzcGF0Y2giLCJob3N0IiwiZXZlbnRUeXBlIiwib3B0aW9ucyIsImRpc3BhdGNoRXZlbnQiLCJDdXN0b21FdmVudCIsImJ1YmJsZXMiLCJzaGFkeUNTUyIsImZuIiwiZmFsbGJhY2siLCJzaGFkeSIsIndpbmRvdyIsIlNoYWR5Q1NTIiwibmF0aXZlU2hhZG93Iiwic3RyaW5naWZ5RWxlbWVudCIsInRhcmdldCIsIlN0cmluZyIsInRhZ05hbWUiLCJJU19JRSIsImRlZmVycmVkIiwiUHJvbWlzZSIsInJlc29sdmUiLCJzdG9yZVBvaW50ZXIiLCJXZWFrTWFwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxjQUFjLEdBQUcsSUFBSUMsR0FBSixFQUF2QjtBQUNBLE9BQU8sU0FBU0MsV0FBVCxDQUFxQkMsR0FBckIsRUFBMEI7QUFDL0IsTUFBSUMsTUFBTSxHQUFHSixjQUFjLENBQUNLLEdBQWYsQ0FBbUJGLEdBQW5CLENBQWI7O0FBQ0EsTUFBSUMsTUFBTSxLQUFLRSxTQUFmLEVBQTBCO0FBQ3hCRixJQUFBQSxNQUFNLEdBQUdELEdBQUcsQ0FBQ0ksT0FBSixDQUFZLGlCQUFaLEVBQStCLE9BQS9CLEVBQXdDQyxXQUF4QyxFQUFUO0FBQ0FSLElBQUFBLGNBQWMsQ0FBQ1MsR0FBZixDQUFtQk4sR0FBbkIsRUFBd0JDLE1BQXhCO0FBQ0Q7O0FBQ0QsU0FBT0EsTUFBUDtBQUNEO0FBRUQsT0FBTyxTQUFTTSxZQUFULENBQXNCUCxHQUF0QixFQUEyQjtBQUNoQyxTQUFPRCxXQUFXLENBQUNDLEdBQUcsQ0FBQ0ksT0FBSixDQUFZLDBCQUFaLEVBQXdDLEtBQXhDLENBQUQsQ0FBbEI7QUFDRDtBQUVELE9BQU8sU0FBU0ksUUFBVCxDQUFrQkMsSUFBbEIsRUFBd0JDLFNBQXhCLEVBQWlEO0FBQUEsTUFBZEMsT0FBYyx1RUFBSixFQUFJO0FBQ3RELFNBQU9GLElBQUksQ0FBQ0csYUFBTCxDQUNMLElBQUlDLFdBQUosQ0FBZ0JILFNBQWhCO0FBQTZCSSxJQUFBQSxPQUFPLEVBQUU7QUFBdEMsS0FBZ0RILE9BQWhELEVBREssQ0FBUDtBQUdEO0FBRUQsT0FBTyxTQUFTSSxRQUFULENBQWtCQyxFQUFsQixFQUFzQkMsUUFBdEIsRUFBZ0M7QUFDckMsTUFBTUMsS0FBSyxHQUFHQyxNQUFNLENBQUNDLFFBQXJCO0FBRUE7O0FBQ0EsTUFBSUYsS0FBSyxJQUFJLENBQUNBLEtBQUssQ0FBQ0csWUFBcEIsRUFBa0M7QUFDaEMsV0FBT0wsRUFBRSxDQUFDRSxLQUFELENBQVQ7QUFDRDs7QUFFRCxTQUFPRCxRQUFQO0FBQ0Q7QUFFRCxPQUFPLFNBQVNLLGdCQUFULENBQTBCQyxNQUExQixFQUFrQztBQUN2QyxvQkFBV0MsTUFBTSxDQUFDRCxNQUFNLENBQUNFLE9BQVIsQ0FBTixDQUF1QnBCLFdBQXZCLEVBQVg7QUFDRDtBQUVELE9BQU8sSUFBTXFCLEtBQUssSUFBRyxtQkFBbUJQLE1BQXRCLENBQVg7QUFDUCxPQUFPLElBQU1RLFFBQVEsR0FBR0MsT0FBTyxDQUFDQyxPQUFSLEVBQWpCO0FBRVAsT0FBTyxJQUFNQyxZQUFZLEdBQUcsSUFBSUMsT0FBSixFQUFyQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNhbWVsVG9EYXNoTWFwID0gbmV3IE1hcCgpO1xuZXhwb3J0IGZ1bmN0aW9uIGNhbWVsVG9EYXNoKHN0cikge1xuICBsZXQgcmVzdWx0ID0gY2FtZWxUb0Rhc2hNYXAuZ2V0KHN0cik7XG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJlc3VsdCA9IHN0ci5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCBcIiQxLSQyXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgY2FtZWxUb0Rhc2hNYXAuc2V0KHN0ciwgcmVzdWx0KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFzY2FsVG9EYXNoKHN0cikge1xuICByZXR1cm4gY2FtZWxUb0Rhc2goc3RyLnJlcGxhY2UoLygoPyEoW0EtWl17Mn18XikpW0EtWl0pL2csIFwiLSQxXCIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3BhdGNoKGhvc3QsIGV2ZW50VHlwZSwgb3B0aW9ucyA9IHt9KSB7XG4gIHJldHVybiBob3N0LmRpc3BhdGNoRXZlbnQoXG4gICAgbmV3IEN1c3RvbUV2ZW50KGV2ZW50VHlwZSwgeyBidWJibGVzOiBmYWxzZSwgLi4ub3B0aW9ucyB9KSxcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNoYWR5Q1NTKGZuLCBmYWxsYmFjaykge1xuICBjb25zdCBzaGFkeSA9IHdpbmRvdy5TaGFkeUNTUztcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICBpZiAoc2hhZHkgJiYgIXNoYWR5Lm5hdGl2ZVNoYWRvdykge1xuICAgIHJldHVybiBmbihzaGFkeSk7XG4gIH1cblxuICByZXR1cm4gZmFsbGJhY2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnlFbGVtZW50KHRhcmdldCkge1xuICByZXR1cm4gYDwke1N0cmluZyh0YXJnZXQudGFnTmFtZSkudG9Mb3dlckNhc2UoKX0+YDtcbn1cblxuZXhwb3J0IGNvbnN0IElTX0lFID0gXCJBY3RpdmVYT2JqZWN0XCIgaW4gd2luZG93O1xuZXhwb3J0IGNvbnN0IGRlZmVycmVkID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbmV4cG9ydCBjb25zdCBzdG9yZVBvaW50ZXIgPSBuZXcgV2Vha01hcCgpO1xuIl19