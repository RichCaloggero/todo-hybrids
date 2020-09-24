function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

import { stringifyElement, shadyCSS, IS_IE } from "../utils.js";
import { dataMap, removeTemplate } from "./utils.js";
import resolveValue from "./resolvers/value.js";
import resolveProperty from "./resolvers/property.js";
/* istanbul ignore next */

try {
  process.env.NODE_ENV;
} catch (e) {
  var process = {
    env: {
      NODE_ENV: 'production'
    }
  };
} // eslint-disable-line


var TIMESTAMP = Date.now();
export var getPlaceholder = function getPlaceholder() {
  var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  return "{{h-".concat(TIMESTAMP, "-").concat(id, "}}");
};
var PLACEHOLDER_REGEXP_TEXT = getPlaceholder("(\\d+)");
var PLACEHOLDER_REGEXP_EQUAL = new RegExp("^".concat(PLACEHOLDER_REGEXP_TEXT, "$"));
var PLACEHOLDER_REGEXP_ALL = new RegExp(PLACEHOLDER_REGEXP_TEXT, "g");
var ATTR_PREFIX = "--".concat(TIMESTAMP, "--");
var ATTR_REGEXP = new RegExp(ATTR_PREFIX, "g");
var preparedTemplates = new WeakMap();
/* istanbul ignore next */

function applyShadyCSS(template, tagName) {
  if (!tagName) return template;
  return shadyCSS(function (shady) {
    var map = preparedTemplates.get(template);

    if (!map) {
      map = new Map();
      preparedTemplates.set(template, map);
    }

    var clone = map.get(tagName);

    if (!clone) {
      clone = document.createElement("template");
      clone.content.appendChild(template.content.cloneNode(true));
      map.set(tagName, clone);
      var styles = clone.content.querySelectorAll("style");
      Array.from(styles).forEach(function (style) {
        var count = style.childNodes.length + 1;

        for (var i = 0; i < count; i += 1) {
          style.parentNode.insertBefore(document.createTextNode(getPlaceholder()), style);
        }
      });
      shady.prepareTemplate(clone, tagName.toLowerCase());
    }

    return clone;
  }, template);
}

function createSignature(parts, styles) {
  var signature = parts.reduce(function (acc, part, index) {
    if (index === 0) {
      return part;
    }

    if (parts.slice(index).join("").match(/^\s*<\/\s*(table|tr|thead|tbody|tfoot|colgroup)>/)) {
      return "".concat(acc, "<!--").concat(getPlaceholder(index - 1), "-->").concat(part);
    }

    return acc + getPlaceholder(index - 1) + part;
  }, "");

  if (styles) {
    signature += "<style>\n".concat(styles.join("\n/*------*/\n"), "\n</style>");
  }
  /* istanbul ignore if */


  if (IS_IE) {
    return signature.replace(/style\s*=\s*(["][^"]+["]|['][^']+[']|[^\s"'<>/]+)/g, function (match) {
      return "".concat(ATTR_PREFIX).concat(match);
    });
  }

  return signature;
}

function getPropertyName(string) {
  return string.replace(/\s*=\s*['"]*$/g, "").split(/\s+/).pop();
}

function replaceComments(fragment) {
  var iterator = document.createNodeIterator(fragment, NodeFilter.SHOW_COMMENT, null, false);
  var node; // eslint-disable-next-line no-cond-assign

  while (node = iterator.nextNode()) {
    if (PLACEHOLDER_REGEXP_EQUAL.test(node.textContent)) {
      node.parentNode.insertBefore(document.createTextNode(node.textContent), node);
      node.parentNode.removeChild(node);
    }
  }
}

export function createInternalWalker(context) {
  var node;
  return {
    get currentNode() {
      return node;
    },

    nextNode: function nextNode() {
      if (node === undefined) {
        node = context.childNodes[0];
      } else if (node.childNodes.length) {
        node = node.childNodes[0];
      } else if (node.nextSibling) {
        node = node.nextSibling;
      } else {
        var parentNode = node.parentNode;
        node = parentNode.nextSibling;

        while (!node && parentNode !== context) {
          parentNode = parentNode.parentNode;
          node = parentNode.nextSibling;
        }
      }

      return !!node;
    }
  };
}

function createExternalWalker(context) {
  return document.createTreeWalker(context, // eslint-disable-next-line no-bitwise
  NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null, false);
}
/* istanbul ignore next */


var createWalker = _typeof(window.ShadyDOM) === "object" && window.ShadyDOM.inUse ? createInternalWalker : createExternalWalker;
var container = document.createElement("div");
var styleSheetsMap = new Map();

function normalizeWhitespace(input) {
  var startIndent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  input = input.replace(/(^[\n\s\t ]+)|([\n\s\t ]+$)+/g, "");
  var i = input.indexOf("\n");

  if (i > -1) {
    var indent = 0 - startIndent - 2;

    for (i += 1; input[i] === " " && i < input.length; i += 1) {
      indent += 1;
    }

    return input.replace(/\n +/g, function (t) {
      return t.substr(0, Math.max(t.length - indent, 1));
    });
  }

  return input;
}

function beautifyTemplateLog(input, index) {
  var placeholder = getPlaceholder(index);
  var output = normalizeWhitespace(input).split("\n").filter(function (i) {
    return i;
  }).map(function (line) {
    var startIndex = line.indexOf(placeholder);

    if (startIndex > -1) {
      return "| ".concat(line, "\n--").concat("-".repeat(startIndex)).concat("^".repeat(6));
    }

    return "| ".concat(line);
  }).join("\n") // eslint-disable-next-line no-template-curly-in-string
  .replace(PLACEHOLDER_REGEXP_ALL, "${...}");
  return "".concat(output);
}

export function compileTemplate(rawParts, isSVG, styles) {
  var template = document.createElement("template");
  var parts = [];
  var signature = createSignature(rawParts, styles);
  if (isSVG) signature = "<svg>".concat(signature, "</svg>");
  /* istanbul ignore if */

  if (IS_IE) {
    template.innerHTML = signature;
  } else {
    container.innerHTML = "<template>".concat(signature, "</template>");
    template.content.appendChild(container.children[0].content);
  }

  if (isSVG) {
    var svgRoot = template.content.firstChild;
    template.content.removeChild(svgRoot);
    Array.from(svgRoot.childNodes).forEach(function (node) {
      return template.content.appendChild(node);
    });
  }

  replaceComments(template.content);
  var compileWalker = createWalker(template.content);
  var compileIndex = 0;

  var _loop = function _loop() {
    var node = compileWalker.currentNode;

    if (node.nodeType === Node.TEXT_NODE) {
      var text = node.textContent;

      if (!text.match(PLACEHOLDER_REGEXP_EQUAL)) {
        var results = text.match(PLACEHOLDER_REGEXP_ALL);

        if (results) {
          var currentNode = node;
          results.reduce(function (acc, placeholder) {
            var _acc$pop$split = acc.pop().split(placeholder),
                _acc$pop$split2 = _slicedToArray(_acc$pop$split, 2),
                before = _acc$pop$split2[0],
                next = _acc$pop$split2[1];

            if (before) acc.push(before);
            acc.push(placeholder);
            if (next) acc.push(next);
            return acc;
          }, [text]).forEach(function (part, index) {
            if (index === 0) {
              currentNode.textContent = part;
            } else {
              currentNode = currentNode.parentNode.insertBefore(document.createTextNode(part), currentNode.nextSibling);
            }
          });
        }
      }

      var equal = node.textContent.match(PLACEHOLDER_REGEXP_EQUAL);

      if (equal) {
        /* istanbul ignore else */
        if (!IS_IE) node.textContent = "";
        parts[equal[1]] = [compileIndex, resolveValue];
      }
    } else {
      /* istanbul ignore else */
      // eslint-disable-next-line no-lonely-if
      if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.attributes).forEach(function (attr) {
          var value = attr.value.trim();
          /* istanbul ignore next */

          var name = IS_IE ? attr.name.replace(ATTR_PREFIX, "") : attr.name;
          var equal = value.match(PLACEHOLDER_REGEXP_EQUAL);

          if (equal) {
            var propertyName = getPropertyName(rawParts[equal[1]]);
            parts[equal[1]] = [compileIndex, resolveProperty(name, propertyName, isSVG)];
            node.removeAttribute(attr.name);
          } else {
            var _results = value.match(PLACEHOLDER_REGEXP_ALL);

            if (_results) {
              var partialName = "attr__".concat(name);

              _results.forEach(function (placeholder, index) {
                var _placeholder$match = placeholder.match(PLACEHOLDER_REGEXP_EQUAL),
                    _placeholder$match2 = _slicedToArray(_placeholder$match, 2),
                    id = _placeholder$match2[1];

                parts[id] = [compileIndex, function (host, target, attrValue) {
                  var data = dataMap.get(target, {});
                  data[partialName] = (data[partialName] || value).replace(placeholder, attrValue == null ? "" : attrValue);

                  if (_results.length === 1 || index + 1 === _results.length) {
                    target.setAttribute(name, data[partialName]);
                    data[partialName] = undefined;
                  }
                }];
              });

              attr.value = "";
              /* istanbul ignore next */

              if (IS_IE && name !== attr.name) {
                node.removeAttribute(attr.name);
                node.setAttribute(name, "");
              }
            }
          }
        });
      }
    }

    compileIndex += 1;
  };

  while (compileWalker.nextNode()) {
    _loop();
  }

  return function updateTemplateInstance(host, target, args, styleSheets) {
    var data = dataMap.get(target, {
      type: "function"
    });

    if (template !== data.template) {
      if (data.template || target.nodeType === Node.ELEMENT_NODE) {
        removeTemplate(target);
      }

      data.prevArgs = null;
      var fragment = document.importNode(applyShadyCSS(template, host.tagName).content, true);
      var renderWalker = createWalker(fragment);
      var clonedParts = parts.slice(0);
      var renderIndex = 0;
      var currentPart = clonedParts.shift();
      var markers = [];
      data.template = template;
      data.markers = markers;

      while (renderWalker.nextNode()) {
        var node = renderWalker.currentNode;

        if (node.nodeType === Node.TEXT_NODE) {
          /* istanbul ignore next */
          if (PLACEHOLDER_REGEXP_EQUAL.test(node.textContent)) {
            node.textContent = "";
          } else if (IS_IE) {
            node.textContent = node.textContent.replace(ATTR_REGEXP, "");
          }
        } else if (process.env.NODE_ENV !== "production" && node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName.indexOf("-") > -1 && !customElements.get(node.tagName.toLowerCase())) {
            throw Error("Missing ".concat(stringifyElement(node), " element definition in ").concat(stringifyElement(host)));
          }
        }

        while (currentPart && currentPart[0] === renderIndex) {
          markers.push([node, currentPart[1]]);
          currentPart = clonedParts.shift();
        }

        renderIndex += 1;
      }

      if (target.nodeType === Node.TEXT_NODE) {
        data.startNode = fragment.childNodes[0];
        data.endNode = fragment.childNodes[fragment.childNodes.length - 1];
        var previousChild = target;
        var child = fragment.childNodes[0];

        while (child) {
          target.parentNode.insertBefore(child, previousChild.nextSibling);
          previousChild = child;
          child = fragment.childNodes[0];
        }
      } else {
        target.appendChild(fragment);
      }
    }

    var adoptedStyleSheets = target.adoptedStyleSheets;

    if (styleSheets) {
      var isEqual = false;
      styleSheets = styleSheets.map(function (style) {
        if (style instanceof CSSStyleSheet) return style;
        var styleSheet = styleSheetsMap.get(style);

        if (!styleSheet) {
          styleSheet = new CSSStyleSheet();
          styleSheet.replaceSync(style);
          styleSheetsMap.set(style, styleSheet);
        }

        return styleSheet;
      });

      if (styleSheets.length === adoptedStyleSheets.length) {
        isEqual = true;

        for (var i = 0; i < styleSheets.length; i += 1) {
          if (styleSheets[i] !== adoptedStyleSheets[i]) {
            isEqual = false;
            break;
          }
        }
      }

      if (!isEqual) target.adoptedStyleSheets = styleSheets;
    } else if (adoptedStyleSheets && adoptedStyleSheets.length) {
      target.adoptedStyleSheets = [];
    }

    var prevArgs = data.prevArgs;
    data.prevArgs = args;

    for (var index = 0; index < data.markers.length; index += 1) {
      var _data$markers$index = _slicedToArray(data.markers[index], 2),
          _node = _data$markers$index[0],
          marker = _data$markers$index[1];

      if (!prevArgs || prevArgs[index] !== args[index]) {
        try {
          marker(host, _node, args[index], prevArgs ? prevArgs[index] : undefined);
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.error("Following error was thrown when updating a template expression in ".concat(stringifyElement(host), "\n").concat(beautifyTemplateLog(signature, index)));
          }

          throw error;
        }
      }
    }

    if (target.nodeType !== Node.TEXT_NODE) {
      shadyCSS(function (shady) {
        if (host.shadowRoot) {
          if (prevArgs) {
            shady.styleSubtree(host);
          } else {
            shady.styleElement(host);
          }
        }
      });
    }
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy90ZW1wbGF0ZS9jb3JlLmpzIl0sIm5hbWVzIjpbInN0cmluZ2lmeUVsZW1lbnQiLCJzaGFkeUNTUyIsIklTX0lFIiwiZGF0YU1hcCIsInJlbW92ZVRlbXBsYXRlIiwicmVzb2x2ZVZhbHVlIiwicmVzb2x2ZVByb3BlcnR5IiwicHJvY2VzcyIsImVudiIsIk5PREVfRU5WIiwiZSIsIlRJTUVTVEFNUCIsIkRhdGUiLCJub3ciLCJnZXRQbGFjZWhvbGRlciIsImlkIiwiUExBQ0VIT0xERVJfUkVHRVhQX1RFWFQiLCJQTEFDRUhPTERFUl9SRUdFWFBfRVFVQUwiLCJSZWdFeHAiLCJQTEFDRUhPTERFUl9SRUdFWFBfQUxMIiwiQVRUUl9QUkVGSVgiLCJBVFRSX1JFR0VYUCIsInByZXBhcmVkVGVtcGxhdGVzIiwiV2Vha01hcCIsImFwcGx5U2hhZHlDU1MiLCJ0ZW1wbGF0ZSIsInRhZ05hbWUiLCJzaGFkeSIsIm1hcCIsImdldCIsIk1hcCIsInNldCIsImNsb25lIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiY29udGVudCIsImFwcGVuZENoaWxkIiwiY2xvbmVOb2RlIiwic3R5bGVzIiwicXVlcnlTZWxlY3RvckFsbCIsIkFycmF5IiwiZnJvbSIsImZvckVhY2giLCJzdHlsZSIsImNvdW50IiwiY2hpbGROb2RlcyIsImxlbmd0aCIsImkiLCJwYXJlbnROb2RlIiwiaW5zZXJ0QmVmb3JlIiwiY3JlYXRlVGV4dE5vZGUiLCJwcmVwYXJlVGVtcGxhdGUiLCJ0b0xvd2VyQ2FzZSIsImNyZWF0ZVNpZ25hdHVyZSIsInBhcnRzIiwic2lnbmF0dXJlIiwicmVkdWNlIiwiYWNjIiwicGFydCIsImluZGV4Iiwic2xpY2UiLCJqb2luIiwibWF0Y2giLCJyZXBsYWNlIiwiZ2V0UHJvcGVydHlOYW1lIiwic3RyaW5nIiwic3BsaXQiLCJwb3AiLCJyZXBsYWNlQ29tbWVudHMiLCJmcmFnbWVudCIsIml0ZXJhdG9yIiwiY3JlYXRlTm9kZUl0ZXJhdG9yIiwiTm9kZUZpbHRlciIsIlNIT1dfQ09NTUVOVCIsIm5vZGUiLCJuZXh0Tm9kZSIsInRlc3QiLCJ0ZXh0Q29udGVudCIsInJlbW92ZUNoaWxkIiwiY3JlYXRlSW50ZXJuYWxXYWxrZXIiLCJjb250ZXh0IiwiY3VycmVudE5vZGUiLCJ1bmRlZmluZWQiLCJuZXh0U2libGluZyIsImNyZWF0ZUV4dGVybmFsV2Fsa2VyIiwiY3JlYXRlVHJlZVdhbGtlciIsIlNIT1dfRUxFTUVOVCIsIlNIT1dfVEVYVCIsImNyZWF0ZVdhbGtlciIsIndpbmRvdyIsIlNoYWR5RE9NIiwiaW5Vc2UiLCJjb250YWluZXIiLCJzdHlsZVNoZWV0c01hcCIsIm5vcm1hbGl6ZVdoaXRlc3BhY2UiLCJpbnB1dCIsInN0YXJ0SW5kZW50IiwiaW5kZXhPZiIsImluZGVudCIsInQiLCJzdWJzdHIiLCJNYXRoIiwibWF4IiwiYmVhdXRpZnlUZW1wbGF0ZUxvZyIsInBsYWNlaG9sZGVyIiwib3V0cHV0IiwiZmlsdGVyIiwibGluZSIsInN0YXJ0SW5kZXgiLCJyZXBlYXQiLCJjb21waWxlVGVtcGxhdGUiLCJyYXdQYXJ0cyIsImlzU1ZHIiwiaW5uZXJIVE1MIiwiY2hpbGRyZW4iLCJzdmdSb290IiwiZmlyc3RDaGlsZCIsImNvbXBpbGVXYWxrZXIiLCJjb21waWxlSW5kZXgiLCJub2RlVHlwZSIsIk5vZGUiLCJURVhUX05PREUiLCJ0ZXh0IiwicmVzdWx0cyIsImJlZm9yZSIsIm5leHQiLCJwdXNoIiwiZXF1YWwiLCJFTEVNRU5UX05PREUiLCJhdHRyaWJ1dGVzIiwiYXR0ciIsInZhbHVlIiwidHJpbSIsIm5hbWUiLCJwcm9wZXJ0eU5hbWUiLCJyZW1vdmVBdHRyaWJ1dGUiLCJwYXJ0aWFsTmFtZSIsImhvc3QiLCJ0YXJnZXQiLCJhdHRyVmFsdWUiLCJkYXRhIiwic2V0QXR0cmlidXRlIiwidXBkYXRlVGVtcGxhdGVJbnN0YW5jZSIsImFyZ3MiLCJzdHlsZVNoZWV0cyIsInR5cGUiLCJwcmV2QXJncyIsImltcG9ydE5vZGUiLCJyZW5kZXJXYWxrZXIiLCJjbG9uZWRQYXJ0cyIsInJlbmRlckluZGV4IiwiY3VycmVudFBhcnQiLCJzaGlmdCIsIm1hcmtlcnMiLCJjdXN0b21FbGVtZW50cyIsIkVycm9yIiwic3RhcnROb2RlIiwiZW5kTm9kZSIsInByZXZpb3VzQ2hpbGQiLCJjaGlsZCIsImFkb3B0ZWRTdHlsZVNoZWV0cyIsImlzRXF1YWwiLCJDU1NTdHlsZVNoZWV0Iiwic3R5bGVTaGVldCIsInJlcGxhY2VTeW5jIiwibWFya2VyIiwiZXJyb3IiLCJjb25zb2xlIiwic2hhZG93Um9vdCIsInN0eWxlU3VidHJlZSIsInN0eWxlRWxlbWVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxTQUFTQSxnQkFBVCxFQUEyQkMsUUFBM0IsRUFBcUNDLEtBQXJDLFFBQWtELGFBQWxEO0FBQ0EsU0FBU0MsT0FBVCxFQUFrQkMsY0FBbEIsUUFBd0MsWUFBeEM7QUFFQSxPQUFPQyxZQUFQLE1BQXlCLHNCQUF6QjtBQUNBLE9BQU9DLGVBQVAsTUFBNEIseUJBQTVCO0FBRUE7O0FBQ0EsSUFBSTtBQUFFQyxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUMsUUFBWjtBQUFzQixDQUE1QixDQUE2QixPQUFNQyxDQUFOLEVBQVM7QUFBRSxNQUFJSCxPQUFPLEdBQUc7QUFBRUMsSUFBQUEsR0FBRyxFQUFFO0FBQUVDLE1BQUFBLFFBQVEsRUFBRTtBQUFaO0FBQVAsR0FBZDtBQUFvRCxDLENBQUM7OztBQUU3RixJQUFNRSxTQUFTLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxFQUFsQjtBQUVBLE9BQU8sSUFBTUMsY0FBYyxHQUFHLFNBQWpCQSxjQUFpQjtBQUFBLE1BQUNDLEVBQUQsdUVBQU0sQ0FBTjtBQUFBLHVCQUFtQkosU0FBbkIsY0FBZ0NJLEVBQWhDO0FBQUEsQ0FBdkI7QUFFUCxJQUFNQyx1QkFBdUIsR0FBR0YsY0FBYyxDQUFDLFFBQUQsQ0FBOUM7QUFDQSxJQUFNRyx3QkFBd0IsR0FBRyxJQUFJQyxNQUFKLFlBQWVGLHVCQUFmLE9BQWpDO0FBQ0Es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LFVBQ3BEZSxLQURvRDtBQUFBLFVBQzlDMkYsTUFEOEM7O0FBRTNELFVBQUksQ0FBQ25CLFFBQUQsSUFBYUEsUUFBUSxDQUFDdkYsS0FBRCxDQUFSLEtBQW9Cb0YsSUFBSSxDQUFDcEYsS0FBRCxDQUF6QyxFQUFrRDtBQUNoRCxZQUFJO0FBQ0YwRyxVQUFBQSxNQUFNLENBQ0o1QixJQURJLEVBRUovRCxLQUZJLEVBR0pxRSxJQUFJLENBQUNwRixLQUFELENBSEEsRUFJSnVGLFFBQVEsR0FBR0EsUUFBUSxDQUFDdkYsS0FBRCxDQUFYLEdBQXFCdUIsU0FKekIsQ0FBTjtBQU1ELFNBUEQsQ0FPRSxPQUFPb0YsS0FBUCxFQUFjO0FBQ2QsY0FBSS9KLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxRQUFaLEtBQXlCLFlBQTdCLEVBQTJDO0FBQ3pDO0FBQ0E4SixZQUFBQSxPQUFPLENBQUNELEtBQVIsNkVBQ3VFdEssZ0JBQWdCLENBQ25GeUksSUFEbUYsQ0FEdkYsZUFHUWxDLG1CQUFtQixDQUFDaEQsU0FBRCxFQUFZSSxLQUFaLENBSDNCO0FBS0Q7O0FBQ0QsZ0JBQU0yRyxLQUFOO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFFBQUk1QixNQUFNLENBQUNuQixRQUFQLEtBQW9CQyxJQUFJLENBQUNDLFNBQTdCLEVBQXdDO0FBQ3RDeEgsTUFBQUEsUUFBUSxDQUFDLFVBQUEwQixLQUFLLEVBQUk7QUFDaEIsWUFBSThHLElBQUksQ0FBQytCLFVBQVQsRUFBcUI7QUFDbkIsY0FBSXRCLFFBQUosRUFBYztBQUNadkgsWUFBQUEsS0FBSyxDQUFDOEksWUFBTixDQUFtQmhDLElBQW5CO0FBQ0QsV0FGRCxNQUVPO0FBQ0w5RyxZQUFBQSxLQUFLLENBQUMrSSxZQUFOLENBQW1CakMsSUFBbkI7QUFDRDtBQUNGO0FBQ0YsT0FSTyxDQUFSO0FBU0Q7QUFDRixHQWxKRDtBQW1KRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHN0cmluZ2lmeUVsZW1lbnQsIHNoYWR5Q1NTLCBJU19JRSB9IGZyb20gXCIuLi91dGlscy5qc1wiO1xuaW1wb3J0IHsgZGF0YU1hcCwgcmVtb3ZlVGVtcGxhdGUgfSBmcm9tIFwiLi91dGlscy5qc1wiO1xuXG5pbXBvcnQgcmVzb2x2ZVZhbHVlIGZyb20gXCIuL3Jlc29sdmVycy92YWx1ZS5qc1wiO1xuaW1wb3J0IHJlc29sdmVQcm9wZXJ0eSBmcm9tIFwiLi9yZXNvbHZlcnMvcHJvcGVydHkuanNcIjtcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbnRyeSB7IHByb2Nlc3MuZW52Lk5PREVfRU5WIH0gY2F0Y2goZSkgeyB2YXIgcHJvY2VzcyA9IHsgZW52OiB7IE5PREVfRU5WOiAncHJvZHVjdGlvbicgfSB9OyB9IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblxuY29uc3QgVElNRVNUQU1QID0gRGF0ZS5ub3coKTtcblxuZXhwb3J0IGNvbnN0IGdldFBsYWNlaG9sZGVyID0gKGlkID0gMCkgPT4gYHt7aC0ke1RJTUVTVEFNUH0tJHtpZH19fWA7XG5cbmNvbnN0IFBMQUNFSE9MREVSX1JFR0VYUF9URVhUID0gZ2V0UGxhY2Vob2xkZXIoXCIoXFxcXGQrKVwiKTtcbmNvbnN0IFBMQUNFSE9MREVSX1JFR0VYUF9FUVVBTCA9IG5ldyBSZWdFeHAoYF4ke1BMQUNFSE9MREVSX1JFR0VYUF9URVhUfSRgKTtcbmNvbnN0IFBMQUNFSE9MREVSX1JFR0VYUF9BTEwgPSBuZXcgUmVnRXhwKFBMQUNFSE9MREVSX1JFR0VYUF9URVhULCBcImdcIik7XG5cbmNvbnN0IEFUVFJfUFJFRklYID0gYC0tJHtUSU1FU1RBTVB9LS1gO1xuY29uc3QgQVRUUl9SRUdFWFAgPSBuZXcgUmVnRXhwKEFUVFJfUFJFRklYLCBcImdcIik7XG5cbmNvbnN0IHByZXBhcmVkVGVtcGxhdGVzID0gbmV3IFdlYWtNYXAoKTtcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIGFwcGx5U2hhZHlDU1ModGVtcGxhdGUsIHRhZ05hbWUpIHtcbiAgaWYgKCF0YWdOYW1lKSByZXR1cm4gdGVtcGxhdGU7XG5cbiAgcmV0dXJuIHNoYWR5Q1NTKHNoYWR5ID0+IHtcbiAgICBsZXQgbWFwID0gcHJlcGFyZWRUZW1wbGF0ZXMuZ2V0KHRlbXBsYXRlKTtcbiAgICBpZiAoIW1hcCkge1xuICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgcHJlcGFyZWRUZW1wbGF0ZXMuc2V0KHRlbXBsYXRlLCBtYXApO1xuICAgIH1cblxuICAgIGxldCBjbG9uZSA9IG1hcC5nZXQodGFnTmFtZSk7XG5cbiAgICBpZiAoIWNsb25lKSB7XG4gICAgICBjbG9uZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbiAgICAgIGNsb25lLmNvbnRlbnQuYXBwZW5kQ2hpbGQodGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuXG4gICAgICBtYXAuc2V0KHRhZ05hbWUsIGNsb25lKTtcblxuICAgICAgY29uc3Qgc3R5bGVzID0gY2xvbmUuY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKFwic3R5bGVcIik7XG5cbiAgICAgIEFycmF5LmZyb20oc3R5bGVzKS5mb3JFYWNoKHN0eWxlID0+IHtcbiAgICAgICAgY29uc3QgY291bnQgPSBzdHlsZS5jaGlsZE5vZGVzLmxlbmd0aCArIDE7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkgKz0gMSkge1xuICAgICAgICAgIHN0eWxlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZ2V0UGxhY2Vob2xkZXIoKSksXG4gICAgICAgICAgICBzdHlsZSxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2hhZHkucHJlcGFyZVRlbXBsYXRlKGNsb25lLCB0YWdOYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2xvbmU7XG4gIH0sIHRlbXBsYXRlKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2lnbmF0dXJlKHBhcnRzLCBzdHlsZXMpIHtcbiAgbGV0IHNpZ25hdHVyZSA9IHBhcnRzLnJlZHVjZSgoYWNjLCBwYXJ0LCBpbmRleCkgPT4ge1xuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHBhcnQ7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgcGFydHNcbiAgICAgICAgLnNsaWNlKGluZGV4KVxuICAgICAgICAuam9pbihcIlwiKVxuICAgICAgICAubWF0Y2goL15cXHMqPFxcL1xccyoodGFibGV8dHJ8dGhlYWR8dGJvZHl8dGZvb3R8Y29sZ3JvdXApPi8pXG4gICAgKSB7XG4gICAgICByZXR1cm4gYCR7YWNjfTwhLS0ke2dldFBsYWNlaG9sZGVyKGluZGV4IC0gMSl9LS0+JHtwYXJ0fWA7XG4gICAgfVxuICAgIHJldHVybiBhY2MgKyBnZXRQbGFjZWhvbGRlcihpbmRleCAtIDEpICsgcGFydDtcbiAgfSwgXCJcIik7XG5cbiAgaWYgKHN0eWxlcykge1xuICAgIHNpZ25hdHVyZSArPSBgPHN0eWxlPlxcbiR7c3R5bGVzLmpvaW4oXCJcXG4vKi0tLS0tLSovXFxuXCIpfVxcbjwvc3R5bGU+YDtcbiAgfVxuXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xuICBpZiAoSVNfSUUpIHtcbiAgICByZXR1cm4gc2lnbmF0dXJlLnJlcGxhY2UoXG4gICAgICAvc3R5bGVcXHMqPVxccyooW1wiXVteXCJdK1tcIl18WyddW14nXStbJ118W15cXHNcIic8Pi9dKykvZyxcbiAgICAgIG1hdGNoID0+IGAke0FUVFJfUFJFRklYfSR7bWF0Y2h9YCxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIHNpZ25hdHVyZTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcGVydHlOYW1lKHN0cmluZykge1xuICByZXR1cm4gc3RyaW5nXG4gICAgLnJlcGxhY2UoL1xccyo9XFxzKlsnXCJdKiQvZywgXCJcIilcbiAgICAuc3BsaXQoL1xccysvKVxuICAgIC5wb3AoKTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZUNvbW1lbnRzKGZyYWdtZW50KSB7XG4gIGNvbnN0IGl0ZXJhdG9yID0gZG9jdW1lbnQuY3JlYXRlTm9kZUl0ZXJhdG9yKFxuICAgIGZyYWdtZW50LFxuICAgIE5vZGVGaWx0ZXIuU0hPV19DT01NRU5ULFxuICAgIG51bGwsXG4gICAgZmFsc2UsXG4gICk7XG4gIGxldCBub2RlO1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uZC1hc3NpZ25cbiAgd2hpbGUgKChub2RlID0gaXRlcmF0b3IubmV4dE5vZGUoKSkpIHtcbiAgICBpZiAoUExBQ0VIT0xERVJfUkVHRVhQX0VRVUFMLnRlc3Qobm9kZS50ZXh0Q29udGVudCkpIHtcbiAgICAgIG5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoXG4gICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5vZGUudGV4dENvbnRlbnQpLFxuICAgICAgICBub2RlLFxuICAgICAgKTtcbiAgICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUludGVybmFsV2Fsa2VyKGNvbnRleHQpIHtcbiAgbGV0IG5vZGU7XG5cbiAgcmV0dXJuIHtcbiAgICBnZXQgY3VycmVudE5vZGUoKSB7XG4gICAgICByZXR1cm4gbm9kZTtcbiAgICB9LFxuICAgIG5leHROb2RlKCkge1xuICAgICAgaWYgKG5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBub2RlID0gY29udGV4dC5jaGlsZE5vZGVzWzBdO1xuICAgICAgfSBlbHNlIGlmIChub2RlLmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICAgIG5vZGUgPSBub2RlLmNoaWxkTm9kZXNbMF07XG4gICAgICB9IGVsc2UgaWYgKG5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcGFyZW50Tm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgbm9kZSA9IHBhcmVudE5vZGUubmV4dFNpYmxpbmc7XG5cbiAgICAgICAgd2hpbGUgKCFub2RlICYmIHBhcmVudE5vZGUgIT09IGNvbnRleHQpIHtcbiAgICAgICAgICBwYXJlbnROb2RlID0gcGFyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgIG5vZGUgPSBwYXJlbnROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAhIW5vZGU7XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRXh0ZXJuYWxXYWxrZXIoY29udGV4dCkge1xuICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihcbiAgICBjb250ZXh0LFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1iaXR3aXNlXG4gICAgTm9kZUZpbHRlci5TSE9XX0VMRU1FTlQgfCBOb2RlRmlsdGVyLlNIT1dfVEVYVCxcbiAgICBudWxsLFxuICAgIGZhbHNlLFxuICApO1xufVxuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuY29uc3QgY3JlYXRlV2Fsa2VyID1cbiAgdHlwZW9mIHdpbmRvdy5TaGFkeURPTSA9PT0gXCJvYmplY3RcIiAmJiB3aW5kb3cuU2hhZHlET00uaW5Vc2VcbiAgICA/IGNyZWF0ZUludGVybmFsV2Fsa2VyXG4gICAgOiBjcmVhdGVFeHRlcm5hbFdhbGtlcjtcblxuY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbmNvbnN0IHN0eWxlU2hlZXRzTWFwID0gbmV3IE1hcCgpO1xuXG5mdW5jdGlvbiBub3JtYWxpemVXaGl0ZXNwYWNlKGlucHV0LCBzdGFydEluZGVudCA9IDApIHtcbiAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC8oXltcXG5cXHNcXHQgXSspfChbXFxuXFxzXFx0IF0rJCkrL2csIFwiXCIpO1xuXG4gIGxldCBpID0gaW5wdXQuaW5kZXhPZihcIlxcblwiKTtcbiAgaWYgKGkgPiAtMSkge1xuICAgIGxldCBpbmRlbnQgPSAwIC0gc3RhcnRJbmRlbnQgLSAyO1xuICAgIGZvciAoaSArPSAxOyBpbnB1dFtpXSA9PT0gXCIgXCIgJiYgaSA8IGlucHV0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpbmRlbnQgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcbiArL2csIHQgPT5cbiAgICAgIHQuc3Vic3RyKDAsIE1hdGgubWF4KHQubGVuZ3RoIC0gaW5kZW50LCAxKSksXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBpbnB1dDtcbn1cblxuZnVuY3Rpb24gYmVhdXRpZnlUZW1wbGF0ZUxvZyhpbnB1dCwgaW5kZXgpIHtcbiAgY29uc3QgcGxhY2Vob2xkZXIgPSBnZXRQbGFjZWhvbGRlcihpbmRleCk7XG5cbiAgY29uc3Qgb3V0cHV0ID0gbm9ybWFsaXplV2hpdGVzcGFjZShpbnB1dClcbiAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAuZmlsdGVyKGkgPT4gaSlcbiAgICAubWFwKGxpbmUgPT4ge1xuICAgICAgY29uc3Qgc3RhcnRJbmRleCA9IGxpbmUuaW5kZXhPZihwbGFjZWhvbGRlcik7XG5cbiAgICAgIGlmIChzdGFydEluZGV4ID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIGB8ICR7bGluZX1cXG4tLSR7XCItXCIucmVwZWF0KHN0YXJ0SW5kZXgpfSR7XCJeXCIucmVwZWF0KDYpfWA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBgfCAke2xpbmV9YDtcbiAgICB9KVxuICAgIC5qb2luKFwiXFxuXCIpXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXRlbXBsYXRlLWN1cmx5LWluLXN0cmluZ1xuICAgIC5yZXBsYWNlKFBMQUNFSE9MREVSX1JFR0VYUF9BTEwsIFwiJHsuLi59XCIpO1xuXG4gIHJldHVybiBgJHtvdXRwdXR9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVUZW1wbGF0ZShyYXdQYXJ0cywgaXNTVkcsIHN0eWxlcykge1xuICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbiAgY29uc3QgcGFydHMgPSBbXTtcblxuICBsZXQgc2lnbmF0dXJlID0gY3JlYXRlU2lnbmF0dXJlKHJhd1BhcnRzLCBzdHlsZXMpO1xuICBpZiAoaXNTVkcpIHNpZ25hdHVyZSA9IGA8c3ZnPiR7c2lnbmF0dXJlfTwvc3ZnPmA7XG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gIGlmIChJU19JRSkge1xuICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IHNpZ25hdHVyZTtcbiAgfSBlbHNlIHtcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYDx0ZW1wbGF0ZT4ke3NpZ25hdHVyZX08L3RlbXBsYXRlPmA7XG4gICAgdGVtcGxhdGUuY29udGVudC5hcHBlbmRDaGlsZChjb250YWluZXIuY2hpbGRyZW5bMF0uY29udGVudCk7XG4gIH1cblxuICBpZiAoaXNTVkcpIHtcbiAgICBjb25zdCBzdmdSb290ID0gdGVtcGxhdGUuY29udGVudC5maXJzdENoaWxkO1xuICAgIHRlbXBsYXRlLmNvbnRlbnQucmVtb3ZlQ2hpbGQoc3ZnUm9vdCk7XG4gICAgQXJyYXkuZnJvbShzdmdSb290LmNoaWxkTm9kZXMpLmZvckVhY2gobm9kZSA9PlxuICAgICAgdGVtcGxhdGUuY29udGVudC5hcHBlbmRDaGlsZChub2RlKSxcbiAgICApO1xuICB9XG5cbiAgcmVwbGFjZUNvbW1lbnRzKHRlbXBsYXRlLmNvbnRlbnQpO1xuXG4gIGNvbnN0IGNvbXBpbGVXYWxrZXIgPSBjcmVhdGVXYWxrZXIodGVtcGxhdGUuY29udGVudCk7XG4gIGxldCBjb21waWxlSW5kZXggPSAwO1xuXG4gIHdoaWxlIChjb21waWxlV2Fsa2VyLm5leHROb2RlKCkpIHtcbiAgICBjb25zdCBub2RlID0gY29tcGlsZVdhbGtlci5jdXJyZW50Tm9kZTtcblxuICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgY29uc3QgdGV4dCA9IG5vZGUudGV4dENvbnRlbnQ7XG5cbiAgICAgIGlmICghdGV4dC5tYXRjaChQTEFDRUhPTERFUl9SRUdFWFBfRVFVQUwpKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHMgPSB0ZXh0Lm1hdGNoKFBMQUNFSE9MREVSX1JFR0VYUF9BTEwpO1xuICAgICAgICBpZiAocmVzdWx0cykge1xuICAgICAgICAgIGxldCBjdXJyZW50Tm9kZSA9IG5vZGU7XG4gICAgICAgICAgcmVzdWx0c1xuICAgICAgICAgICAgLnJlZHVjZShcbiAgICAgICAgICAgICAgKGFjYywgcGxhY2Vob2xkZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBbYmVmb3JlLCBuZXh0XSA9IGFjYy5wb3AoKS5zcGxpdChwbGFjZWhvbGRlcik7XG4gICAgICAgICAgICAgICAgaWYgKGJlZm9yZSkgYWNjLnB1c2goYmVmb3JlKTtcbiAgICAgICAgICAgICAgICBhY2MucHVzaChwbGFjZWhvbGRlcik7XG4gICAgICAgICAgICAgICAgaWYgKG5leHQpIGFjYy5wdXNoKG5leHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIFt0ZXh0XSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5mb3JFYWNoKChwYXJ0LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS50ZXh0Q29udGVudCA9IHBhcnQ7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShcbiAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhcnQpLFxuICAgICAgICAgICAgICAgICAgY3VycmVudE5vZGUubmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgZXF1YWwgPSBub2RlLnRleHRDb250ZW50Lm1hdGNoKFBMQUNFSE9MREVSX1JFR0VYUF9FUVVBTCk7XG4gICAgICBpZiAoZXF1YWwpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgICAgaWYgKCFJU19JRSkgbm9kZS50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgIHBhcnRzW2VxdWFsWzFdXSA9IFtjb21waWxlSW5kZXgsIHJlc29sdmVWYWx1ZV07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1sb25lbHktaWZcbiAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICBBcnJheS5mcm9tKG5vZGUuYXR0cmlidXRlcykuZm9yRWFjaChhdHRyID0+IHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHIudmFsdWUudHJpbSgpO1xuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgY29uc3QgbmFtZSA9IElTX0lFID8gYXR0ci5uYW1lLnJlcGxhY2UoQVRUUl9QUkVGSVgsIFwiXCIpIDogYXR0ci5uYW1lO1xuICAgICAgICAgIGNvbnN0IGVxdWFsID0gdmFsdWUubWF0Y2goUExBQ0VIT0xERVJfUkVHRVhQX0VRVUFMKTtcbiAgICAgICAgICBpZiAoZXF1YWwpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5TmFtZSA9IGdldFByb3BlcnR5TmFtZShyYXdQYXJ0c1tlcXVhbFsxXV0pO1xuICAgICAgICAgICAgcGFydHNbZXF1YWxbMV1dID0gW1xuICAgICAgICAgICAgICBjb21waWxlSW5kZXgsXG4gICAgICAgICAgICAgIHJlc29sdmVQcm9wZXJ0eShuYW1lLCBwcm9wZXJ0eU5hbWUsIGlzU1ZHKSxcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyLm5hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHRzID0gdmFsdWUubWF0Y2goUExBQ0VIT0xERVJfUkVHRVhQX0FMTCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0cykge1xuICAgICAgICAgICAgICBjb25zdCBwYXJ0aWFsTmFtZSA9IGBhdHRyX18ke25hbWV9YDtcblxuICAgICAgICAgICAgICByZXN1bHRzLmZvckVhY2goKHBsYWNlaG9sZGVyLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IFssIGlkXSA9IHBsYWNlaG9sZGVyLm1hdGNoKFBMQUNFSE9MREVSX1JFR0VYUF9FUVVBTCk7XG4gICAgICAgICAgICAgICAgcGFydHNbaWRdID0gW1xuICAgICAgICAgICAgICAgICAgY29tcGlsZUluZGV4LFxuICAgICAgICAgICAgICAgICAgKGhvc3QsIHRhcmdldCwgYXR0clZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBkYXRhTWFwLmdldCh0YXJnZXQsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtwYXJ0aWFsTmFtZV0gPSAoZGF0YVtwYXJ0aWFsTmFtZV0gfHwgdmFsdWUpLnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIsXG4gICAgICAgICAgICAgICAgICAgICAgYXR0clZhbHVlID09IG51bGwgPyBcIlwiIDogYXR0clZhbHVlLFxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMSB8fCBpbmRleCArIDEgPT09IHJlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShuYW1lLCBkYXRhW3BhcnRpYWxOYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgZGF0YVtwYXJ0aWFsTmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IFwiXCI7XG5cbiAgICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgICAgaWYgKElTX0lFICYmIG5hbWUgIT09IGF0dHIubmFtZSkge1xuICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHIubmFtZSk7XG4gICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgXCJcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBpbGVJbmRleCArPSAxO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZVRlbXBsYXRlSW5zdGFuY2UoaG9zdCwgdGFyZ2V0LCBhcmdzLCBzdHlsZVNoZWV0cykge1xuICAgIGNvbnN0IGRhdGEgPSBkYXRhTWFwLmdldCh0YXJnZXQsIHsgdHlwZTogXCJmdW5jdGlvblwiIH0pO1xuXG4gICAgaWYgKHRlbXBsYXRlICE9PSBkYXRhLnRlbXBsYXRlKSB7XG4gICAgICBpZiAoZGF0YS50ZW1wbGF0ZSB8fCB0YXJnZXQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHJlbW92ZVRlbXBsYXRlKHRhcmdldCk7XG4gICAgICB9XG5cbiAgICAgIGRhdGEucHJldkFyZ3MgPSBudWxsO1xuXG4gICAgICBjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmltcG9ydE5vZGUoXG4gICAgICAgIGFwcGx5U2hhZHlDU1ModGVtcGxhdGUsIGhvc3QudGFnTmFtZSkuY29udGVudCxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHJlbmRlcldhbGtlciA9IGNyZWF0ZVdhbGtlcihmcmFnbWVudCk7XG4gICAgICBjb25zdCBjbG9uZWRQYXJ0cyA9IHBhcnRzLnNsaWNlKDApO1xuXG4gICAgICBsZXQgcmVuZGVySW5kZXggPSAwO1xuICAgICAgbGV0IGN1cnJlbnRQYXJ0ID0gY2xvbmVkUGFydHMuc2hpZnQoKTtcblxuICAgICAgY29uc3QgbWFya2VycyA9IFtdO1xuXG4gICAgICBkYXRhLnRlbXBsYXRlID0gdGVtcGxhdGU7XG4gICAgICBkYXRhLm1hcmtlcnMgPSBtYXJrZXJzO1xuXG4gICAgICB3aGlsZSAocmVuZGVyV2Fsa2VyLm5leHROb2RlKCkpIHtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHJlbmRlcldhbGtlci5jdXJyZW50Tm9kZTtcblxuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIGlmIChQTEFDRUhPTERFUl9SRUdFWFBfRVFVQUwudGVzdChub2RlLnRleHRDb250ZW50KSkge1xuICAgICAgICAgICAgbm9kZS50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICAgICAgfSBlbHNlIGlmIChJU19JRSkge1xuICAgICAgICAgICAgbm9kZS50ZXh0Q29udGVudCA9IG5vZGUudGV4dENvbnRlbnQucmVwbGFjZShBVFRSX1JFR0VYUCwgXCJcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiAmJlxuICAgICAgICAgIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFXG4gICAgICAgICkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIG5vZGUudGFnTmFtZS5pbmRleE9mKFwiLVwiKSA+IC0xICYmXG4gICAgICAgICAgICAhY3VzdG9tRWxlbWVudHMuZ2V0KG5vZGUudGFnTmFtZS50b0xvd2VyQ2FzZSgpKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgICAgIGBNaXNzaW5nICR7c3RyaW5naWZ5RWxlbWVudChcbiAgICAgICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgICApfSBlbGVtZW50IGRlZmluaXRpb24gaW4gJHtzdHJpbmdpZnlFbGVtZW50KGhvc3QpfWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChjdXJyZW50UGFydCAmJiBjdXJyZW50UGFydFswXSA9PT0gcmVuZGVySW5kZXgpIHtcbiAgICAgICAgICBtYXJrZXJzLnB1c2goW25vZGUsIGN1cnJlbnRQYXJ0WzFdXSk7XG4gICAgICAgICAgY3VycmVudFBhcnQgPSBjbG9uZWRQYXJ0cy5zaGlmdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVuZGVySW5kZXggKz0gMTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhcmdldC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgZGF0YS5zdGFydE5vZGUgPSBmcmFnbWVudC5jaGlsZE5vZGVzWzBdO1xuICAgICAgICBkYXRhLmVuZE5vZGUgPSBmcmFnbWVudC5jaGlsZE5vZGVzW2ZyYWdtZW50LmNoaWxkTm9kZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgbGV0IHByZXZpb3VzQ2hpbGQgPSB0YXJnZXQ7XG5cbiAgICAgICAgbGV0IGNoaWxkID0gZnJhZ21lbnQuY2hpbGROb2Rlc1swXTtcbiAgICAgICAgd2hpbGUgKGNoaWxkKSB7XG4gICAgICAgICAgdGFyZ2V0LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNoaWxkLCBwcmV2aW91c0NoaWxkLm5leHRTaWJsaW5nKTtcbiAgICAgICAgICBwcmV2aW91c0NoaWxkID0gY2hpbGQ7XG4gICAgICAgICAgY2hpbGQgPSBmcmFnbWVudC5jaGlsZE5vZGVzWzBdO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFkb3B0ZWRTdHlsZVNoZWV0cyA9IHRhcmdldC5hZG9wdGVkU3R5bGVTaGVldHM7XG4gICAgaWYgKHN0eWxlU2hlZXRzKSB7XG4gICAgICBsZXQgaXNFcXVhbCA9IGZhbHNlO1xuXG4gICAgICBzdHlsZVNoZWV0cyA9IHN0eWxlU2hlZXRzLm1hcChzdHlsZSA9PiB7XG4gICAgICAgIGlmIChzdHlsZSBpbnN0YW5jZW9mIENTU1N0eWxlU2hlZXQpIHJldHVybiBzdHlsZTtcblxuICAgICAgICBsZXQgc3R5bGVTaGVldCA9IHN0eWxlU2hlZXRzTWFwLmdldChzdHlsZSk7XG4gICAgICAgIGlmICghc3R5bGVTaGVldCkge1xuICAgICAgICAgIHN0eWxlU2hlZXQgPSBuZXcgQ1NTU3R5bGVTaGVldCgpO1xuICAgICAgICAgIHN0eWxlU2hlZXQucmVwbGFjZVN5bmMoc3R5bGUpO1xuICAgICAgICAgIHN0eWxlU2hlZXRzTWFwLnNldChzdHlsZSwgc3R5bGVTaGVldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0eWxlU2hlZXQ7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHN0eWxlU2hlZXRzLmxlbmd0aCA9PT0gYWRvcHRlZFN0eWxlU2hlZXRzLmxlbmd0aCkge1xuICAgICAgICBpc0VxdWFsID0gdHJ1ZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHlsZVNoZWV0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgIGlmIChzdHlsZVNoZWV0c1tpXSAhPT0gYWRvcHRlZFN0eWxlU2hlZXRzW2ldKSB7XG4gICAgICAgICAgICBpc0VxdWFsID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFpc0VxdWFsKSB0YXJnZXQuYWRvcHRlZFN0eWxlU2hlZXRzID0gc3R5bGVTaGVldHM7XG4gICAgfSBlbHNlIGlmIChhZG9wdGVkU3R5bGVTaGVldHMgJiYgYWRvcHRlZFN0eWxlU2hlZXRzLmxlbmd0aCkge1xuICAgICAgdGFyZ2V0LmFkb3B0ZWRTdHlsZVNoZWV0cyA9IFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZBcmdzID0gZGF0YS5wcmV2QXJncztcbiAgICBkYXRhLnByZXZBcmdzID0gYXJncztcblxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBkYXRhLm1hcmtlcnMubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgICBjb25zdCBbbm9kZSwgbWFya2VyXSA9IGRhdGEubWFya2Vyc1tpbmRleF07XG4gICAgICBpZiAoIXByZXZBcmdzIHx8IHByZXZBcmdzW2luZGV4XSAhPT0gYXJnc1tpbmRleF0pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBtYXJrZXIoXG4gICAgICAgICAgICBob3N0LFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIGFyZ3NbaW5kZXhdLFxuICAgICAgICAgICAgcHJldkFyZ3MgPyBwcmV2QXJnc1tpbmRleF0gOiB1bmRlZmluZWQsXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgYEZvbGxvd2luZyBlcnJvciB3YXMgdGhyb3duIHdoZW4gdXBkYXRpbmcgYSB0ZW1wbGF0ZSBleHByZXNzaW9uIGluICR7c3RyaW5naWZ5RWxlbWVudChcbiAgICAgICAgICAgICAgICBob3N0LFxuICAgICAgICAgICAgICApfVxcbiR7YmVhdXRpZnlUZW1wbGF0ZUxvZyhzaWduYXR1cmUsIGluZGV4KX1gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGFyZ2V0Lm5vZGVUeXBlICE9PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgc2hhZHlDU1Moc2hhZHkgPT4ge1xuICAgICAgICBpZiAoaG9zdC5zaGFkb3dSb290KSB7XG4gICAgICAgICAgaWYgKHByZXZBcmdzKSB7XG4gICAgICAgICAgICBzaGFkeS5zdHlsZVN1YnRyZWUoaG9zdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNoYWR5LnN0eWxlRWxlbWVudChob3N0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn1cbiJdfQ==