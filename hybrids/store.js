function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-use-before-define */
import * as cache from "./cache.js";
import { storePointer } from "./utils.js";
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


export var connect = "__store__connect__".concat(Date.now(), "__");
var definitions = new WeakMap();

function resolve(config, model, lastModel) {
  if (lastModel) definitions.set(lastModel, null);
  definitions.set(model, config);
  return model;
}

function resolveWithInvalidate(config, model, lastModel) {
  resolve(config, model, lastModel);

  if (config.external && model || !lastModel || error(model)) {
    config.invalidate();
  }

  return model;
}

function sync(config, id, model, invalidate) {
  cache.set(config, id, invalidate ? resolveWithInvalidate : resolve, model, true);
  return model;
}

var currentTimestamp;

function getCurrentTimestamp() {
  if (!currentTimestamp) {
    currentTimestamp = Date.now();
    requestAnimationFrame(function () {
      currentTimestamp = undefined;
    });
  }

  return currentTimestamp;
}

var timestamps = new WeakMap();

function getTimestamp(model) {
  var timestamp = timestamps.get(model);

  if (!timestamp) {
    timestamp = getCurrentTimestamp();
    timestamps.set(model, timestamp);
  }

  return timestamp;
}

function setTimestamp(model) {
  timestamps.set(model, getCurrentTimestamp());
  return model;
}

function setupStorage(storage) {
  if (typeof storage === "function") storage = {
    get: storage
  };

  var result = _objectSpread({
    cache: true
  }, storage);

  if (result.cache === false || result.cache === 0) {
    result.validate = function (cachedModel) {
      return !cachedModel || getTimestamp(cachedModel) === getCurrentTimestamp();
    };
  } else if (typeof result.cache === "number") {
    result.validate = function (cachedModel) {
      return !cachedModel || getTimestamp(cachedModel) + result.cache > getCurrentTimestamp();
    };
  } else if (result.cache !== true) {
    throw TypeError("Storage cache property must be a boolean or number: ".concat(_typeof(result.cache)));
  }

  return Object.freeze(result);
}

function memoryStorage(config) {
  return {
    get: config.enumerable ? function () {} : function () {
      return config.create({});
    },
    set: config.enumerable ? function (id, values) {
      return values;
    } : function (id, values) {
      return values === null ? {
        id: id
      } : values;
    },
    list: config.enumerable && function list(id) {
      if (id) {
        throw TypeError("Memory-based model definition does not support id");
      }

      return cache.getEntries(config).reduce(function (acc, _ref) {
        var key = _ref.key,
            value = _ref.value;
        if (key === config) return acc;
        if (value && !error(value)) acc.push(key);
        return acc;
      }, []);
    }
  };
}

function bootstrap(Model, nested) {
  if (Array.isArray(Model)) {
    return setupListModel(Model[0], nested);
  }

  return setupModel(Model, nested);
}

function getTypeConstructor(type, key) {
  switch (type) {
    case "string":
      return function (v) {
        return v !== undefined && v !== null ? String(v) : "";
      };

    case "number":
      return Number;

    case "boolean":
      return Boolean;

    default:
      throw TypeError("The value of the '".concat(key, "' must be a string, number or boolean: ").concat(type));
  }
}

var stateSetter = function stateSetter(h, v) {
  return v;
};

function setModelState(model, state) {
  var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : model;
  cache.set(model, "state", stateSetter, {
    state: state,
    value: value
  }, true);
  return model;
}

var stateGetter = function stateGetter(model) {
  var v = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    state: "ready",
    value: model
  };
  return v;
};

function getModelState(model) {
  return cache.get(model, "state", stateGetter);
} // UUID v4 generator thanks to https://gist.github.com/jed/982883


function uuid(temp) {
  return temp ? // eslint-disable-next-line no-bitwise, no-mixed-operators
  (temp ^ Math.random() * 16 >> temp / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
}

var validationMap = new WeakMap();

function resolveKey(Model, key, config) {
  var defaultValue = config.model[key];

  var type = _typeof(config.model[key]);

  if (defaultValue instanceof String || defaultValue instanceof Number) {
    var check = validationMap.get(defaultValue);

    if (!check) {
      throw TypeError(stringifyModel(Model, "You must use primitive ".concat(_typeof(defaultValue.valueOf()), " value for '").concat(key, "' property of the provided model definition")));
    }

    defaultValue = defaultValue.valueOf();
    type = _typeof(defaultValue);
    config.checks.set(key, check);
  }

  return {
    defaultValue: defaultValue,
    type: type
  };
}

function stringifyModel(Model, msg) {
  return "".concat(msg, ":\n\n").concat(JSON.stringify(Model, function (key, value) {
    if (key === connect) return undefined;
    return value;
  }, 2), "\n\n");
}

var _ = function _(h, v) {
  return v;
};

var resolvedPromise = Promise.resolve();
var configs = new WeakMap();

function setupModel(Model, nested) {
  if (_typeof(Model) !== "object" || Model === null) {
    throw TypeError("Model definition must be an object: ".concat(_typeof(Model)));
  }

  var config = configs.get(Model);

  if (config && !config.enumerable) {
    if (nested && !config.nested) {
      throw TypeError(stringifyModel(Model, "Provided model definition for nested object already used as a root definition"));
    }

    if (!nested && config.nested) {
      throw TypeError(stringifyModel(Model, "Nested model definition cannot be used outside of the parent definition"));
    }
  }

  if (!config) {
    var storage = Model[connect];
    if (_typeof(storage) === "object") Object.freeze(storage);
    var invalidatePromise;
    var _placeholder = {};
    var enumerable = hasOwnProperty.call(Model, "id");
    var checks = new Map();
    config = {
      model: Model,
      external: !!storage,
      enumerable: enumerable,
      nested: !enumerable && nested,
      placeholder: function placeholder(id) {
        return Object.freeze(Object.assign(Object.create(_placeholder), {
          id: id
        }));
      },
      isInstance: function isInstance(model) {
        return Object.getPrototypeOf(model) !== _placeholder;
      },
      invalidate: function invalidate() {
        if (!invalidatePromise) {
          invalidatePromise = resolvedPromise.then(function () {
            cache.invalidate(config, config, true);
            invalidatePromise = null;
          });
        }
      },
      checks: checks
    };
    config.storage = setupStorage(storage || memoryStorage(config, Model));
    var transform = Object.keys(Object.freeze(Model)).filter(function (key) {
      return key !== connect;
    }).map(function (key) {
      if (key !== "id") {
        Object.defineProperty(_placeholder, key, {
          get: function get() {
            throw Error("Model instance in ".concat(getModelState(this).state, " state - use store.pending(), store.error(), or store.ready() guards"));
          },
          enumerable: true
        });
      }

      if (key === "id") {
        if (Model[key] !== true) {
          throw TypeError("The 'id' property in model definition must be set to 'true' or not be defined");
        }

        return function (model, data, lastModel) {
          var id;

          if (lastModel) {
            id = lastModel.id;
          } else if (hasOwnProperty.call(data, "id")) {
            id = String(data.id);
          } else {
            id = uuid();
          }

          Object.defineProperty(model, "id", {
            value: id,
            enumerable: true
          });
        };
      }

      var _resolveKey = resolveKey(Model, key, config),
          defaultValue = _resolveKey.defaultValue,
          type = _resolveKey.type;

      switch (type) {
        case "function":
          return function (model) {
            Object.defineProperty(model, key, {
              get: function get() {
                return cache.get(this, key, defaultValue);
              }
            });
          };

        case "object":
          {
            if (defaultValue === null) {
              throw TypeError("The value for the '".concat(key, "' must be an object instance: ").concat(defaultValue));
            }

            var isArray = Array.isArray(defaultValue);

            if (isArray) {
              var nestedType = _typeof(defaultValue[0]);

              if (nestedType !== "object") {
                var Constructor = getTypeConstructor(nestedType, key);
                var defaultArray = Object.freeze(defaultValue.map(Constructor));
                return function (model, data, lastModel) {
                  if (hasOwnProperty.call(data, key)) {
                    if (!Array.isArray(data[key])) {
                      throw TypeError("The value for '".concat(key, "' property must be an array: ").concat(_typeof(data[key])));
                    }

                    model[key] = Object.freeze(data[key].map(Constructor));
                  } else if (lastModel && hasOwnProperty.call(lastModel, key)) {
                    model[key] = lastModel[key];
                  } else {
                    model[key] = defaultArray;
                  }
                };
              }

              var localConfig = bootstrap(defaultValue, true);

              if (localConfig.enumerable && defaultValue[1]) {
                var nestedOptions = defaultValue[1];

                if (_typeof(nestedOptions) !== "object") {
                  throw TypeError("Options for '".concat(key, "' array property must be an object instance: ").concat(_typeof(nestedOptions)));
                }

                if (nestedOptions.loose) {
                  config.contexts = config.contexts || new Set();
                  config.contexts.add(bootstrap(defaultValue[0]));
                }
              }

              return function (model, data, lastModel) {
                if (hasOwnProperty.call(data, key)) {
                  if (!Array.isArray(data[key])) {
                    throw TypeError("The value for '".concat(key, "' property must be an array: ").concat(_typeof(data[key])));
                  }

                  model[key] = localConfig.create(data[key]);
                } else {
                  model[key] = lastModel && lastModel[key] || !localConfig.enumerable && localConfig.create(defaultValue) || [];
                }
              };
            }

            var nestedConfig = bootstrap(defaultValue, true);

            if (nestedConfig.enumerable || nestedConfig.external) {
              return function (model, data, lastModel) {
                var resultModel;

                if (hasOwnProperty.call(data, key)) {
                  var nestedData = data[key];

                  if (_typeof(nestedData) !== "object" || nestedData === null) {
                    if (nestedData !== undefined && nestedData !== null) {
                      resultModel = {
                        id: nestedData
                      };
                    }
                  } else {
                    var dataConfig = definitions.get(nestedData);

                    if (dataConfig) {
                      if (dataConfig.model !== defaultValue) {
                        throw TypeError("Model instance must match the definition");
                      }

                      resultModel = nestedData;
                    } else {
                      resultModel = nestedConfig.create(nestedData);
                      sync(nestedConfig, resultModel.id, resultModel);
                    }
                  }
                } else {
                  resultModel = lastModel && lastModel[key];
                }

                if (resultModel) {
                  var id = resultModel.id;
                  Object.defineProperty(model, key, {
                    get: function get() {
                      return cache.get(this, key, pending(this) ? _ : function () {
                        return _get(defaultValue, id);
                      });
                    },
                    enumerable: true
                  });
                } else {
                  model[key] = undefined;
                }
              };
            }

            return function (model, data, lastModel) {
              if (hasOwnProperty.call(data, key)) {
                model[key] = nestedConfig.create(data[key], lastModel && lastModel[key]);
              } else {
                model[key] = lastModel ? lastModel[key] : nestedConfig.create({});
              }
            };
          }
        // eslint-disable-next-line no-fallthrough

        default:
          {
            var _Constructor = getTypeConstructor(type, key);

            return function (model, data, lastModel) {
              if (hasOwnProperty.call(data, key)) {
                model[key] = _Constructor(data[key]);
              } else if (lastModel && hasOwnProperty.call(lastModel, key)) {
                model[key] = lastModel[key];
              } else {
                model[key] = defaultValue;
              }
            };
          }
      }
    });

    config.create = function create(data, lastModel) {
      if (data === null) return null;

      if (_typeof(data) !== "object") {
        throw TypeError("Model values must be an object instance: ".concat(data));
      }

      var model = transform.reduce(function (acc, fn) {
        fn(acc, data, lastModel);
        return acc;
      }, {});
      definitions.set(model, config);
      storePointer.set(model, store);
      return Object.freeze(model);
    };

    Object.freeze(_placeholder);
    configs.set(Model, Object.freeze(config));
  }

  return config;
}

var listPlaceholderPrototype = Object.getOwnPropertyNames(Array.prototype).reduce(function (acc, key) {
  if (key === "length" || key === "constructor") return acc;
  Object.defineProperty(acc, key, {
    get: function get() {
      throw Error("Model list instance in ".concat(getModelState(this).state, " state - use store.pending(), store.error(), or store.ready() guards"));
    }
  });
  return acc;
}, []);
var lists = new WeakMap();

function setupListModel(Model, nested) {
  var config = lists.get(Model);

  if (config && !config.enumerable) {
    if (!nested && config.nested) {
      throw TypeError(stringifyModel(Model, "Nested model definition cannot be used outside of the parent definition"));
    }
  }

  if (!config) {
    var modelConfig = setupModel(Model);
    var contexts = new Set();
    contexts.add(modelConfig);

    if (!nested) {
      if (!modelConfig.enumerable) {
        throw TypeError(stringifyModel(Model, "Provided model definition does not support listing (it must be enumerable - set `id` property to `true`)"));
      }

      if (!modelConfig.storage.list) {
        throw TypeError(stringifyModel(Model, "Provided model definition storage does not support `list` action"));
      }
    }

    config = {
      list: true,
      nested: !modelConfig.enumerable && nested,
      model: Model,
      contexts: contexts,
      enumerable: modelConfig.enumerable,
      storage: setupStorage({
        cache: modelConfig.storage.cache,
        get: !nested && function (id) {
          return modelConfig.storage.list(id);
        }
      }),
      placeholder: function placeholder() {
        return Object.freeze(Object.create(listPlaceholderPrototype));
      },
      isInstance: function isInstance(model) {
        return Object.getPrototypeOf(model) !== listPlaceholderPrototype;
      },
      create: function create(items) {
        var result = items.reduce(function (acc, data) {
          var id = data;

          if (_typeof(data) === "object" && data !== null) {
            id = data.id;
            var dataConfig = definitions.get(data);
            var model = data;

            if (dataConfig) {
              if (dataConfig.model !== Model) {
                throw TypeError("Model instance must match the definition");
              }
            } else {
              model = modelConfig.create(data);

              if (modelConfig.enumerable) {
                id = model.id;
                sync(modelConfig, id, model);
              }
            }

            if (!modelConfig.enumerable) {
              acc.push(model);
            }
          } else if (!modelConfig.enumerable) {
            throw TypeError("Model instance must be an object: ".concat(_typeof(data)));
          }

          if (modelConfig.enumerable) {
            var key = acc.length;
            Object.defineProperty(acc, key, {
              get: function get() {
                return cache.get(this, key, pending(this) ? _ : function () {
                  return _get(Model, id);
                });
              },
              enumerable: true
            });
          }

          return acc;
        }, []);
        definitions.set(result, config);
        storePointer.set(result, store);
        return Object.freeze(result);
      }
    };
    lists.set(Model, Object.freeze(config));
  }

  return config;
}

function resolveTimestamp(h, v) {
  return v || getCurrentTimestamp();
}

function stringifyId(id) {
  switch (_typeof(id)) {
    case "object":
      return JSON.stringify(Object.keys(id).sort().reduce(function (acc, key) {
        if (_typeof(id[key]) === "object" && id[key] !== null) {
          throw TypeError("You must use primitive value for '".concat(key, "' key: ").concat(_typeof(id[key])));
        }

        acc[key] = id[key];
        return acc;
      }, {}));

    case "undefined":
      return undefined;

    default:
      return String(id);
  }
}

function mapError(model, err, suppressLog) {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== "production" && suppressLog !== false) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return setModelState(model, "error", err);
}

function _get(Model, id) {
  var config = bootstrap(Model);
  var stringId;

  if (!config.storage.get) {
    throw TypeError(stringifyModel(Model, "Provided model definition does not support 'get' method"));
  }

  if (config.enumerable) {
    stringId = stringifyId(id);

    if (!config.list && !stringId) {
      throw TypeError(stringifyModel(Model, "Provided model definition requires non-empty id: \"".concat(stringId, "\"")));
    }
  } else if (id !== undefined) {
    throw TypeError(stringifyModel(Model, "Provided model definition does not support id"));
  }

  return cache.get(config, stringId, function (h, cachedModel) {
    if (cachedModel && pending(cachedModel)) return cachedModel;
    var validContexts = true;

    if (config.contexts) {
      config.contexts.forEach(function (context) {
        if (cache.get(context, context, resolveTimestamp) === getCurrentTimestamp()) {
          validContexts = false;
        }
      });
    }

    if (validContexts && cachedModel && (config.storage.cache === true || config.storage.validate(cachedModel))) {
      return cachedModel;
    }

    try {
      var result = config.storage.get(id);

      if (_typeof(result) !== "object" || result === null) {
        throw Error("Model instance ".concat(stringId !== undefined ? "with '".concat(stringId, "' id") : "", " does not exist"));
      }

      if (result instanceof Promise) {
        result = result.then(function (data) {
          if (_typeof(data) !== "object" || data === null) {
            throw Error("Model instance ".concat(stringId !== undefined ? "with '".concat(stringId, "' id") : "", " does not exist"));
          }

          return sync(config, stringId, config.create(stringId ? _objectSpread({}, data, {
            id: stringId
          }) : data));
        }).catch(function (e) {
          return sync(config, stringId, mapError(cachedModel || config.placeholder(stringId), e));
        });
        return setModelState(cachedModel || config.placeholder(stringId), "pending", result);
      }

      if (cachedModel) definitions.set(cachedModel, null);
      return setTimestamp(config.create(stringId ? _objectSpread({}, result, {
        id: stringId
      }) : result));
    } catch (e) {
      return setTimestamp(mapError(cachedModel || config.placeholder(stringId), e));
    }
  }, config.storage.validate);
}

var draftMap = new WeakMap();

function getValidationError(errors) {
  var keys = Object.keys(errors);
  var e = Error("Model validation failed (".concat(keys.join(", "), ") - read the details from 'errors' property"));
  e.errors = errors;
  return e;
}

function set(model) {
  var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var config = definitions.get(model);
  var isInstance = !!config;

  if (config === null) {
    throw Error("Provided model instance has expired. Haven't you used stale value?");
  }

  if (!config) config = bootstrap(model);

  if (config.nested) {
    throw stringifyModel(config.model, TypeError("Setting provided nested model instance is not supported, use the root model instance"));
  }

  if (config.list) {
    throw TypeError("Listing model definition does not support 'set' method");
  }

  if (!config.storage.set) {
    throw stringifyModel(config.model, TypeError("Provided model definition storage does not support 'set' method"));
  }

  if (isInstance && pending(model)) {
    throw Error("Provided model instance is in pending state");
  }

  var id;

  var setState = function setState(state, value) {
    if (isInstance) {
      setModelState(model, state, value);
    } else {
      var entry = cache.getEntry(config, id);

      if (entry.value) {
        setModelState(entry.value, state, value);
      }
    }
  };

  try {
    if (config.enumerable && !isInstance && (!values || _typeof(values) !== "object")) {
      throw TypeError("Values must be an object instance: ".concat(values));
    }

    if (values && hasOwnProperty.call(values, "id")) {
      throw TypeError("Values must not contain 'id' property: ".concat(values.id));
    }

    var localModel = config.create(values, isInstance ? model : undefined);
    var keys = values ? Object.keys(values) : [];
    var isDraft = draftMap.get(config);
    var errors = {};
    var lastError = isInstance && isDraft && error(model);
    var hasErrors = false;

    if (localModel) {
      config.checks.forEach(function (fn, key) {
        if (keys.indexOf(key) === -1) {
          if (lastError && lastError.errors && lastError.errors[key]) {
            hasErrors = true;
            errors[key] = lastError.errors[key];
          } // eslint-disable-next-line eqeqeq


          if (isDraft && localModel[key] == config.model[key]) {
            return;
          }
        }

        var checkResult;

        try {
          checkResult = fn(localModel[key], key, localModel);
        } catch (e) {
          checkResult = e;
        }

        if (checkResult !== true && checkResult !== undefined) {
          hasErrors = true;
          errors[key] = checkResult || true;
        }
      });

      if (hasErrors && !isDraft) {
        throw getValidationError(errors);
      }
    }

    id = localModel ? localModel.id : model.id;
    var result = Promise.resolve(config.storage.set(isInstance ? id : undefined, localModel, keys)).then(function (data) {
      var resultModel = data === localModel ? localModel : config.create(data);

      if (isInstance && resultModel && id !== resultModel.id) {
        throw TypeError("Local and storage data must have the same id: '".concat(id, "', '").concat(resultModel.id, "'"));
      }

      var resultId = resultModel ? resultModel.id : id;

      if (hasErrors && isDraft) {
        setModelState(resultModel, "error", getValidationError(errors));
      }

      return sync(config, resultId, resultModel || mapError(config.placeholder(resultId), Error("Model instance ".concat(id !== undefined ? "with '".concat(id, "' id") : "", " does not exist")), false), true);
    }).catch(function (err) {
      err = err !== undefined ? err : Error("Undefined error");
      setState("error", err);
      throw err;
    });
    setState("pending", result);
    return result;
  } catch (e) {
    setState("error", e);
    return Promise.reject(e);
  }
}

function clear(model) {
  var clearValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  if (_typeof(model) !== "object" || model === null) {
    throw TypeError("The first argument must be a model instance or a model definition: ".concat(model));
  }

  var config = definitions.get(model);

  if (config === null) {
    throw Error("Provided model instance has expired. Haven't you used stale value from the outer scope?");
  }

  if (config) {
    cache.invalidate(config, model.id, clearValue, true);
  } else {
    if (!configs.get(model) && !lists.get(model[0])) {
      throw Error("Model definition must be used before - passed argument is probably not a model definition");
    }

    cache.invalidateAll(bootstrap(model), clearValue, true);
  }
}

function pending(model) {
  if (model === null || _typeof(model) !== "object") return false;

  var _getModelState = getModelState(model),
      state = _getModelState.state,
      value = _getModelState.value;

  return state === "pending" && value;
}

function error(model, property) {
  if (model === null || _typeof(model) !== "object") return false;

  var _getModelState2 = getModelState(model),
      state = _getModelState2.state,
      value = _getModelState2.value;

  var result = state === "error" && value;

  if (result && property !== undefined) {
    return result.errors && result.errors[property];
  }

  return result;
}

function ready(model) {
  if (model === null || _typeof(model) !== "object") return false;
  var config = definitions.get(model);
  return !!(config && config.isInstance(model));
}

function mapValueWithState(lastValue, nextValue) {
  var result = Object.freeze(Object.keys(lastValue).reduce(function (acc, key) {
    Object.defineProperty(acc, key, {
      get: function get() {
        return lastValue[key];
      },
      enumerable: true
    });
    return acc;
  }, Object.create(lastValue)));
  definitions.set(result, definitions.get(lastValue));

  var _getModelState3 = getModelState(nextValue),
      state = _getModelState3.state,
      value = _getModelState3.value;

  return setModelState(result, state, value);
}

function getValuesFromModel(model) {
  var values = _objectSpread({}, model);

  delete values.id;
  return values;
}

function submit(draft) {
  var config = definitions.get(draft);

  if (!config || !draftMap.has(config)) {
    throw TypeError("Provided model instance is not a draft: ".concat(draft));
  }

  if (pending(draft)) {
    throw Error("Model draft in pending state");
  }

  var options = draftMap.get(config);
  var result;

  if (!options.id) {
    result = store.set(options.model, getValuesFromModel(draft));
  } else {
    var model = store.get(options.model, draft.id);
    result = Promise.resolve(pending(model) || model).then(function (resolvedModel) {
      return store.set(resolvedModel, getValuesFromModel(draft));
    });
  }

  result = result.then(function (resultModel) {
    setModelState(draft, "ready");
    return store.set(draft, getValuesFromModel(resultModel)).then(function () {
      return resultModel;
    });
  }).catch(function (e) {
    setModelState(draft, "error", e);
    return Promise.reject(e);
  });
  setModelState(draft, "pending", result);
  return result;
}

function required(value, key) {
  return !!value || "".concat(key, " is required");
}

function valueWithValidation(defaultValue) {
  var validate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : required;
  var errorMessage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";

  switch (_typeof(defaultValue)) {
    case "string":
      // eslint-disable-next-line no-new-wrappers
      defaultValue = new String(defaultValue);
      break;

    case "number":
      // eslint-disable-next-line no-new-wrappers
      defaultValue = new Number(defaultValue);
      break;

    default:
      throw TypeError("Default value must be a string or a number: ".concat(_typeof(defaultValue)));
  }

  var fn;

  if (validate instanceof RegExp) {
    fn = function fn(value) {
      return validate.test(value) || errorMessage;
    };
  } else if (typeof validate === "function") {
    fn = function fn() {
      var result = validate.apply(void 0, arguments);
      return result !== true && result !== undefined ? result || errorMessage : result;
    };
  } else {
    throw TypeError("The second argument must be a RegExp instance or a function: ".concat(_typeof(validate)));
  }

  validationMap.set(defaultValue, fn);
  return defaultValue;
}

function store(Model) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var config = bootstrap(Model);

  if (_typeof(options) !== "object") {
    options = {
      id: options
    };
  }

  if (options.id !== undefined && typeof options.id !== "function") {
    var id = options.id;

    options.id = function (host) {
      return host[id];
    };
  }

  if (options.draft) {
    if (config.list) {
      throw TypeError("Draft mode is not supported for listing model definition");
    }

    Model = _objectSpread({}, Model, _defineProperty({}, store.connect, {
      get: function get(id) {
        var model = store.get(config.model, id);
        return ready(model) ? model : pending(model);
      },
      set: function set(id, values) {
        return values === null ? {
          id: id
        } : values;
      }
    }));
    options.draft = bootstrap(Model);
    draftMap.set(options.draft, {
      model: config.model,
      id: options.id
    });
  }

  var createMode = options.draft && config.enumerable && !options.id;
  var desc = {
    get: function get(host, lastValue) {
      if (createMode && !lastValue) {
        var _nextValue = options.draft.create({});

        sync(options.draft, _nextValue.id, _nextValue);
        return store.get(Model, _nextValue.id);
      }

      var id = options.draft && lastValue ? lastValue.id : options.id && options.id(host);
      var nextValue = store.get(Model, id);

      if (lastValue && nextValue !== lastValue && !ready(nextValue)) {
        return mapValueWithState(lastValue, nextValue);
      }

      return nextValue;
    },
    set: config.list ? undefined : function (host, values, lastValue) {
      if (!lastValue || !ready(lastValue)) lastValue = desc.get(host);
      store.set(lastValue, values).catch(
      /* istanbul ignore next */
      function () {});
      return lastValue;
    },
    connect: options.draft ? function () {
      return function () {
        return clear(Model, false);
      };
    } : undefined
  };
  return desc;
}

export default Object.assign(store, {
  // storage
  connect: connect,
  // actions
  get: _get,
  set: set,
  clear: clear,
  // guards
  pending: pending,
  error: error,
  ready: ready,
  // helpers
  submit: submit,
  value: valueWithValidation
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zdG9yZS5qcyJdLCJuYW1lcyI6WyJjYWNoZSIsInN0b3JlUG9pbnRlciIsInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsImUiLCJjb25uZWN0IiwiRGF0ZSIsIm5vdyIsImRlZmluaXRpb25zIiwiV2Vha01hcCIsInJlc29sdmUiLCJjb25maWciLCJtb2RlbCIsImxhc3RNb2RlbCIsInNldCIsInJlc29sdmVXaXRoSW52YWxpZGF0ZSIsImV4dGVybmFsIiwiZXJyb3IiLCJpbnZhbGlkYXRlIiwic3luYyIsImlkIiwiY3VycmVudFRpbWVzdGFtcCIsImdldEN1cnJlbnRUaW1lc3RhbXAiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ1bmRlZmluZWQiLCJ0aW1lc3RhbXBzIiwiZ2V0VGltZXN0YW1wIiwidGltZXN0YW1wIiwiZ2V0Iiwic2V0VGltZXN0YW1wIiwic2V0dXBTdG9yYWdlIiwic3RvcmFnZSIsInJlc3VsdCIsInZhbGlkYXRlIiwiY2FjaGVkTW9kZWwiLCJUeXBlRXJyb3IiLCJPYmplY3QiLCJmcmVlemUiLCJtZW1vcnlTdG9yYWdlIiwiZW51bWVyYWJsZSIsImNyZWF0ZSIsInZhbHVlcyIsImxpc3QiLCJnZXRFbnRyaWVzIiwicmVkdWNlIiwiYWNjIiwia2V5IiwidmFsdWUiLCJwdXNoIiwiYm9vdHN0cmFwIiwiTW9kZWwiLCJuZXN0ZWQiLCJBcnJheSIsImlzQXJyYXkiLCJzZXR1cExpc3RNb2RlbCIsInNldHVwTW9kZWwiLCJnZXRUeXBlQ29uc3RydWN0b3IiLCJ0eXBlIiwidiIsIlN0cmluZyIsIk51bWJlciIsIkJvb2xlYW4iLCJzdGF0ZVNldHRlciIsImgiLCJzZXRNb2RlbFN0YXRlIiwic3RhdGUiLCJzdGF0ZUdldHRlciIsImdldE1vZGVsU3RhdGUiLCJ1dWlkIiwidGVtcCIsIk1hdGgiLCJyYW5kb20iLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJ2YWxpZGF0aW9uTWFwIiwicmVzb2x2ZUtleSIsImRlZmF1bHRWYWx1ZSIsImNoZWNrIiwic3RyaW5naWZ5TW9kZWwiLCJ2YWx1ZU9mIiwiY2hlY2tzIiwibXNnIiwiSlNPTiIsInN0cmluZ2lmeSIsIl8iLCJyZXNvbHZlZFByb21pc2UiLCJQcm9taXNlIiwiY29uZmlncyIsImludmFsaWRhdGVQcm9taXNlIiwicGxhY2Vob2xkZXIiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJNYXAiLCJhc3NpZ24iLCJpc0luc3RhbmNlIiwiZ2V0UHJvdG90eXBlT2YiLCJ0aGVuIiwidHJhbnNmb3JtIiwia2V5cyIsImZpbHRlciIsIm1hcCIsImRlZmluZVByb3BlcnR5IiwiRXJyb3IiLCJkYXRhIiwibmVzdGVkVHlwZSIsIkNvbnN0cnVjdG9yIiwiZGVmYXVsdEFycmF5IiwibG9jYWxDb25maWciLCJuZXN0ZWRPcHRpb25zIiwibG9vc2UiLCJjb250ZXh0cyIsIlNldCIsImFkZCIsIm5lc3RlZENvbmZpZyIsInJlc3VsdE1vZGVsIiwibmVzdGVkRGF0YSIsImRhdGFDb25maWciLCJwZW5kaW5nIiwiZm4iLCJzdG9yZSIsImxpc3RQbGFjZWhvbGRlclByb3RvdHlwZSIsImdldE93blByb3BlcnR5TmFtZXMiLCJwcm90b3R5cGUiLCJsaXN0cyIsIm1vZGVsQ29uZmlnIiwiaXRlbXMiLCJsZW5ndGgiLCJyZXNvbHZlVGltZXN0YW1wIiwic3RyaW5naWZ5SWQiLCJzb3J0IiwibWFwRXJyb3IiLCJlcnIiLCJzdXBwcmVzc0xvZyIsImNvbnNvbGUiLCJzdHJpbmdJZCIsInZhbGlkQ29udGV4dHMiLCJmb3JFYWNoIiwiY29udGV4dCIsImNhdGNoIiwiZHJhZnRNYXAiLCJnZXRWYWxpZGF0aW9uRXJyb3IiLCJlcnJvcnMiLCJqb2luIiwic2V0U3RhdGUiLCJlbnRyeSIsImdldEVudHJ5IiwibG9jYWxNb2RlbCIsImlzRHJhZnQiLCJsYXN0RXJyb3IiLCJoYXNFcnJvcnMiLCJpbmRleE9mIiwiY2hlY2tSZXN1bHQiLCJyZXN1bHRJZCIsInJlamVjdCIsImNsZWFyIiwiY2xlYXJWYWx1ZSIsImludmFsaWRhdGVBbGwiLCJwcm9wZXJ0eSIsInJlYWR5IiwibWFwVmFsdWVXaXRoU3RhdGUiLCJsYXN0VmFsdWUiLCJuZXh0VmFsdWUiLCJnZXRWYWx1ZXNGcm9tTW9kZWwiLCJzdWJtaXQiLCJkcmFmdCIsImhhcyIsIm9wdGlvbnMiLCJyZXNvbHZlZE1vZGVsIiwicmVxdWlyZWQiLCJ2YWx1ZVdpdGhWYWxpZGF0aW9uIiwiZXJyb3JNZXNzYWdlIiwiUmVnRXhwIiwidGVzdCIsImhvc3QiLCJjcmVhdGVNb2RlIiwiZGVzYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTtBQUNBLE9BQU8sS0FBS0EsS0FBWixNQUF1QixZQUF2QjtBQUNBLFNBQVNDLFlBQVQsUUFBNkIsWUFBN0I7QUFFQTs7QUFDQSxJQUFJO0FBQUVDLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxRQUFaO0FBQXNCLENBQTVCLENBQTZCLE9BQU1DLENBQU4sRUFBUztBQUFFLE1BQUlILE9BQU8sR0FBRztBQUFFQyxJQUFBQSxHQUFHLEVBQUU7QUFBRUMsTUFBQUEsUUFBUSxFQUFFO0FBQVo7QUFBUCxHQUFkO0FBQW9ELEMsQ0FBQzs7O0FBRTdGLE9BQU8sSUFBTUUsT0FBTywrQkFBd0JDLElBQUksQ0FBQ0MsR0FBTCxFQUF4QixPQUFiO0FBQ1AsSUFBTUMsV0FBVyxHQUFHLElBQUlDLE9BQUosRUFBcEI7O0FBRUEsU0FBU0MsT0FBVCxDQUFpQkMsTUFBakIsRUFBeUJDLEtBQXpCLEVBQWdDQyxTQUFoQyxFQUEyQztBQUN6QyxNQUFJQSxTQUFKLEVBQWVMLFdBQVcsQ0FBQ00sR0FBWixDQUFnQkQsU0FBaEIsRUFBMkIsSUFBM0I7QUFDZkwsRUFBQUEsV0FBVyxDQUFDTSxHQUFaLENBQWdCRixLQUFoQixFQUF1QkQsTUFBdkI7QUFFQSxTQUFPQyxLQUFQO0FBQ0Q7O0FBRUQsU0FBU0cscUJBQVQsQ0FBK0JKLE1BQS9CLEVBQXVDQyxLQUF2QyxFQUE4Q0MsU0FBOUMsRUFBeUQ7QUFDdkRILEVBQUFBLE9BQU8sQ0FBQ0MsTUFBRCxFQUFTQyxL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Q0FBWDtBQUFBLE9BQU47QUFBQSxLQUFoQixHQUFrRDFCO0FBaENoRCxHQUFiO0FBbUNBLFNBQU91SixJQUFQO0FBQ0Q7O0FBRUQsZUFBZTNJLE1BQU0sQ0FBQ3lELE1BQVAsQ0FBYzBCLEtBQWQsRUFBcUI7QUFDbEM7QUFDQWxILEVBQUFBLE9BQU8sRUFBUEEsT0FGa0M7QUFJbEM7QUFDQXVCLEVBQUFBLEdBQUcsRUFBSEEsSUFMa0M7QUFNbENkLEVBQUFBLEdBQUcsRUFBSEEsR0FOa0M7QUFPbEM0SSxFQUFBQSxLQUFLLEVBQUxBLEtBUGtDO0FBU2xDO0FBQ0FyQyxFQUFBQSxPQUFPLEVBQVBBLE9BVmtDO0FBV2xDcEcsRUFBQUEsS0FBSyxFQUFMQSxLQVhrQztBQVlsQzZJLEVBQUFBLEtBQUssRUFBTEEsS0Faa0M7QUFjbEM7QUFDQUssRUFBQUEsTUFBTSxFQUFOQSxNQWZrQztBQWdCbENwSCxFQUFBQSxLQUFLLEVBQUUwSDtBQWhCMkIsQ0FBckIsQ0FBZiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXVzZS1iZWZvcmUtZGVmaW5lICovXG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tIFwiLi9jYWNoZS5qc1wiO1xuaW1wb3J0IHsgc3RvcmVQb2ludGVyIH0gZnJvbSBcIi4vdXRpbHMuanNcIjtcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbnRyeSB7IHByb2Nlc3MuZW52Lk5PREVfRU5WIH0gY2F0Y2goZSkgeyB2YXIgcHJvY2VzcyA9IHsgZW52OiB7IE5PREVfRU5WOiAncHJvZHVjdGlvbicgfSB9OyB9IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblxuZXhwb3J0IGNvbnN0IGNvbm5lY3QgPSBgX19zdG9yZV9fY29ubmVjdF9fJHtEYXRlLm5vdygpfV9fYDtcbmNvbnN0IGRlZmluaXRpb25zID0gbmV3IFdlYWtNYXAoKTtcblxuZnVuY3Rpb24gcmVzb2x2ZShjb25maWcsIG1vZGVsLCBsYXN0TW9kZWwpIHtcbiAgaWYgKGxhc3RNb2RlbCkgZGVmaW5pdGlvbnMuc2V0KGxhc3RNb2RlbCwgbnVsbCk7XG4gIGRlZmluaXRpb25zLnNldChtb2RlbCwgY29uZmlnKTtcblxuICByZXR1cm4gbW9kZWw7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVXaXRoSW52YWxpZGF0ZShjb25maWcsIG1vZGVsLCBsYXN0TW9kZWwpIHtcbiAgcmVzb2x2ZShjb25maWcsIG1vZGVsLCBsYXN0TW9kZWwpO1xuXG4gIGlmICgoY29uZmlnLmV4dGVybmFsICYmIG1vZGVsKSB8fCAhbGFzdE1vZGVsIHx8IGVycm9yKG1vZGVsKSkge1xuICAgIGNvbmZpZy5pbnZhbGlkYXRlKCk7XG4gIH1cblxuICByZXR1cm4gbW9kZWw7XG59XG5cbmZ1bmN0aW9uIHN5bmMoY29uZmlnLCBpZCwgbW9kZWwsIGludmFsaWRhdGUpIHtcbiAgY2FjaGUuc2V0KFxuICAgIGNvbmZpZyxcbiAgICBpZCxcbiAgICBpbnZhbGlkYXRlID8gcmVzb2x2ZVdpdGhJbnZhbGlkYXRlIDogcmVzb2x2ZSxcbiAgICBtb2RlbCxcbiAgICB0cnVlLFxuICApO1xuICByZXR1cm4gbW9kZWw7XG59XG5cbmxldCBjdXJyZW50VGltZXN0YW1wO1xuZnVuY3Rpb24gZ2V0Q3VycmVudFRpbWVzdGFtcCgpIHtcbiAgaWYgKCFjdXJyZW50VGltZXN0YW1wKSB7XG4gICAgY3VycmVudFRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIGN1cnJlbnRUaW1lc3RhbXAgPSB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRUaW1lc3RhbXA7XG59XG5cbmNvbnN0IHRpbWVzdGFtcHMgPSBuZXcgV2Vha01hcCgpO1xuXG5mdW5jdGlvbiBnZXRUaW1lc3RhbXAobW9kZWwpIHtcbiAgbGV0IHRpbWVzdGFtcCA9IHRpbWVzdGFtcHMuZ2V0KG1vZGVsKTtcblxuICBpZiAoIXRpbWVzdGFtcCkge1xuICAgIHRpbWVzdGFtcCA9IGdldEN1cnJlbnRUaW1lc3RhbXAoKTtcbiAgICB0aW1lc3RhbXBzLnNldChtb2RlbCwgdGltZXN0YW1wKTtcbiAgfVxuXG4gIHJldHVybiB0aW1lc3RhbXA7XG59XG5cbmZ1bmN0aW9uIHNldFRpbWVzdGFtcChtb2RlbCkge1xuICB0aW1lc3RhbXBzLnNldChtb2RlbCwgZ2V0Q3VycmVudFRpbWVzdGFtcCgpKTtcbiAgcmV0dXJuIG1vZGVsO1xufVxuXG5mdW5jdGlvbiBzZXR1cFN0b3JhZ2Uoc3RvcmFnZSkge1xuICBpZiAodHlwZW9mIHN0b3JhZ2UgPT09IFwiZnVuY3Rpb25cIikgc3RvcmFnZSA9IHsgZ2V0OiBzdG9yYWdlIH07XG5cbiAgY29uc3QgcmVzdWx0ID0geyBjYWNoZTogdHJ1ZSwgLi4uc3RvcmFnZSB9O1xuXG4gIGlmIChyZXN1bHQuY2FjaGUgPT09IGZhbHNlIHx8IHJlc3VsdC5jYWNoZSA9PT0gMCkge1xuICAgIHJlc3VsdC52YWxpZGF0ZSA9IGNhY2hlZE1vZGVsID0+XG4gICAgICAhY2FjaGVkTW9kZWwgfHwgZ2V0VGltZXN0YW1wKGNhY2hlZE1vZGVsKSA9PT0gZ2V0Q3VycmVudFRpbWVzdGFtcCgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQuY2FjaGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICByZXN1bHQudmFsaWRhdGUgPSBjYWNoZWRNb2RlbCA9PlxuICAgICAgIWNhY2hlZE1vZGVsIHx8XG4gICAgICBnZXRUaW1lc3RhbXAoY2FjaGVkTW9kZWwpICsgcmVzdWx0LmNhY2hlID4gZ2V0Q3VycmVudFRpbWVzdGFtcCgpO1xuICB9IGVsc2UgaWYgKHJlc3VsdC5jYWNoZSAhPT0gdHJ1ZSkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgIGBTdG9yYWdlIGNhY2hlIHByb3BlcnR5IG11c3QgYmUgYSBib29sZWFuIG9yIG51bWJlcjogJHt0eXBlb2YgcmVzdWx0LmNhY2hlfWAsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBPYmplY3QuZnJlZXplKHJlc3VsdCk7XG59XG5cbmZ1bmN0aW9uIG1lbW9yeVN0b3JhZ2UoY29uZmlnKSB7XG4gIHJldHVybiB7XG4gICAgZ2V0OiBjb25maWcuZW51bWVyYWJsZSA/ICgpID0+IHt9IDogKCkgPT4gY29uZmlnLmNyZWF0ZSh7fSksXG4gICAgc2V0OiBjb25maWcuZW51bWVyYWJsZVxuICAgICAgPyAoaWQsIHZhbHVlcykgPT4gdmFsdWVzXG4gICAgICA6IChpZCwgdmFsdWVzKSA9PiAodmFsdWVzID09PSBudWxsID8geyBpZCB9IDogdmFsdWVzKSxcbiAgICBsaXN0OlxuICAgICAgY29uZmlnLmVudW1lcmFibGUgJiZcbiAgICAgIGZ1bmN0aW9uIGxpc3QoaWQpIHtcbiAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgdGhyb3cgVHlwZUVycm9yKGBNZW1vcnktYmFzZWQgbW9kZWwgZGVmaW5pdGlvbiBkb2VzIG5vdCBzdXBwb3J0IGlkYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FjaGUuZ2V0RW50cmllcyhjb25maWcpLnJlZHVjZSgoYWNjLCB7IGtleSwgdmFsdWUgfSkgPT4ge1xuICAgICAgICAgIGlmIChrZXkgPT09IGNvbmZpZykgcmV0dXJuIGFjYztcbiAgICAgICAgICBpZiAodmFsdWUgJiYgIWVycm9yKHZhbHVlKSkgYWNjLnB1c2goa2V5KTtcbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LCBbXSk7XG4gICAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBib290c3RyYXAoTW9kZWwsIG5lc3RlZCkge1xuICBpZiAoQXJyYXkuaXNBcnJheShNb2RlbCkpIHtcbiAgICByZXR1cm4gc2V0dXBMaXN0TW9kZWwoTW9kZWxbMF0sIG5lc3RlZCk7XG4gIH1cbiAgcmV0dXJuIHNldHVwTW9kZWwoTW9kZWwsIG5lc3RlZCk7XG59XG5cbmZ1bmN0aW9uIGdldFR5cGVDb25zdHJ1Y3Rvcih0eXBlLCBrZXkpIHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgcmV0dXJuIHYgPT4gKHYgIT09IHVuZGVmaW5lZCAmJiB2ICE9PSBudWxsID8gU3RyaW5nKHYpIDogXCJcIik7XG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgcmV0dXJuIE51bWJlcjtcbiAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgcmV0dXJuIEJvb2xlYW47XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICAgYFRoZSB2YWx1ZSBvZiB0aGUgJyR7a2V5fScgbXVzdCBiZSBhIHN0cmluZywgbnVtYmVyIG9yIGJvb2xlYW46ICR7dHlwZX1gLFxuICAgICAgKTtcbiAgfVxufVxuXG5jb25zdCBzdGF0ZVNldHRlciA9IChoLCB2KSA9PiB2O1xuZnVuY3Rpb24gc2V0TW9kZWxTdGF0ZShtb2RlbCwgc3RhdGUsIHZhbHVlID0gbW9kZWwpIHtcbiAgY2FjaGUuc2V0KG1vZGVsLCBcInN0YXRlXCIsIHN0YXRlU2V0dGVyLCB7IHN0YXRlLCB2YWx1ZSB9LCB0cnVlKTtcbiAgcmV0dXJuIG1vZGVsO1xufVxuXG5jb25zdCBzdGF0ZUdldHRlciA9IChtb2RlbCwgdiA9IHsgc3RhdGU6IFwicmVhZHlcIiwgdmFsdWU6IG1vZGVsIH0pID0+IHY7XG5mdW5jdGlvbiBnZXRNb2RlbFN0YXRlKG1vZGVsKSB7XG4gIHJldHVybiBjYWNoZS5nZXQobW9kZWwsIFwic3RhdGVcIiwgc3RhdGVHZXR0ZXIpO1xufVxuXG4vLyBVVUlEIHY0IGdlbmVyYXRvciB0aGFua3MgdG8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vamVkLzk4Mjg4M1xuZnVuY3Rpb24gdXVpZCh0ZW1wKSB7XG4gIHJldHVybiB0ZW1wXG4gICAgPyAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tYml0d2lzZSwgbm8tbWl4ZWQtb3BlcmF0b3JzXG4gICAgICAodGVtcCBeICgoTWF0aC5yYW5kb20oKSAqIDE2KSA+PiAodGVtcCAvIDQpKSkudG9TdHJpbmcoMTYpXG4gICAgOiAoWzFlN10gKyAtMWUzICsgLTRlMyArIC04ZTMgKyAtMWUxMSkucmVwbGFjZSgvWzAxOF0vZywgdXVpZCk7XG59XG5cbmNvbnN0IHZhbGlkYXRpb25NYXAgPSBuZXcgV2Vha01hcCgpO1xuXG5mdW5jdGlvbiByZXNvbHZlS2V5KE1vZGVsLCBrZXksIGNvbmZpZykge1xuICBsZXQgZGVmYXVsdFZhbHVlID0gY29uZmlnLm1vZGVsW2tleV07XG4gIGxldCB0eXBlID0gdHlwZW9mIGNvbmZpZy5tb2RlbFtrZXldO1xuXG4gIGlmIChkZWZhdWx0VmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcgfHwgZGVmYXVsdFZhbHVlIGluc3RhbmNlb2YgTnVtYmVyKSB7XG4gICAgY29uc3QgY2hlY2sgPSB2YWxpZGF0aW9uTWFwLmdldChkZWZhdWx0VmFsdWUpO1xuICAgIGlmICghY2hlY2spIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICAgc3RyaW5naWZ5TW9kZWwoXG4gICAgICAgICAgTW9kZWwsXG4gICAgICAgICAgYFlvdSBtdXN0IHVzZSBwcmltaXRpdmUgJHt0eXBlb2YgZGVmYXVsdFZhbHVlLnZhbHVlT2YoKX0gdmFsdWUgZm9yICcke2tleX0nIHByb3BlcnR5IG9mIHRoZSBwcm92aWRlZCBtb2RlbCBkZWZpbml0aW9uYCxcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZGVmYXVsdFZhbHVlID0gZGVmYXVsdFZhbHVlLnZhbHVlT2YoKTtcbiAgICB0eXBlID0gdHlwZW9mIGRlZmF1bHRWYWx1ZTtcblxuICAgIGNvbmZpZy5jaGVja3Muc2V0KGtleSwgY2hlY2spO1xuICB9XG5cbiAgcmV0dXJuIHsgZGVmYXVsdFZhbHVlLCB0eXBlIH07XG59XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeU1vZGVsKE1vZGVsLCBtc2cpIHtcbiAgcmV0dXJuIGAke21zZ306XFxuXFxuJHtKU09OLnN0cmluZ2lmeShcbiAgICBNb2RlbCxcbiAgICAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgICAgaWYgKGtleSA9PT0gY29ubmVjdCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LFxuICAgIDIsXG4gICl9XFxuXFxuYDtcbn1cblxuY29uc3QgXyA9IChoLCB2KSA9PiB2O1xuXG5jb25zdCByZXNvbHZlZFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmNvbnN0IGNvbmZpZ3MgPSBuZXcgV2Vha01hcCgpO1xuZnVuY3Rpb24gc2V0dXBNb2RlbChNb2RlbCwgbmVzdGVkKSB7XG4gIGlmICh0eXBlb2YgTW9kZWwgIT09IFwib2JqZWN0XCIgfHwgTW9kZWwgPT09IG51bGwpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoYE1vZGVsIGRlZmluaXRpb24gbXVzdCBiZSBhbiBvYmplY3Q6ICR7dHlwZW9mIE1vZGVsfWApO1xuICB9XG5cbiAgbGV0IGNvbmZpZyA9IGNvbmZpZ3MuZ2V0KE1vZGVsKTtcblxuICBpZiAoY29uZmlnICYmICFjb25maWcuZW51bWVyYWJsZSkge1xuICAgIGlmIChuZXN0ZWQgJiYgIWNvbmZpZy5uZXN0ZWQpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICAgc3RyaW5naWZ5TW9kZWwoXG4gICAgICAgICAgTW9kZWwsXG4gICAgICAgICAgXCJQcm92aWRlZCBtb2RlbCBkZWZpbml0aW9uIGZvciBuZXN0ZWQgb2JqZWN0IGFscmVhZHkgdXNlZCBhcyBhIHJvb3QgZGVmaW5pdGlvblwiLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIW5lc3RlZCAmJiBjb25maWcubmVzdGVkKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAgIHN0cmluZ2lmeU1vZGVsKFxuICAgICAgICAgIE1vZGVsLFxuICAgICAgICAgIFwiTmVzdGVkIG1vZGVsIGRlZmluaXRpb24gY2Fubm90IGJlIHVzZWQgb3V0c2lkZSBvZiB0aGUgcGFyZW50IGRlZmluaXRpb25cIixcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb25maWcpIHtcbiAgICBjb25zdCBzdG9yYWdlID0gTW9kZWxbY29ubmVjdF07XG4gICAgaWYgKHR5cGVvZiBzdG9yYWdlID09PSBcIm9iamVjdFwiKSBPYmplY3QuZnJlZXplKHN0b3JhZ2UpO1xuXG4gICAgbGV0IGludmFsaWRhdGVQcm9taXNlO1xuICAgIGNvbnN0IHBsYWNlaG9sZGVyID0ge307XG4gICAgY29uc3QgZW51bWVyYWJsZSA9IGhhc093blByb3BlcnR5LmNhbGwoTW9kZWwsIFwiaWRcIik7XG4gICAgY29uc3QgY2hlY2tzID0gbmV3IE1hcCgpO1xuXG4gICAgY29uZmlnID0ge1xuICAgICAgbW9kZWw6IE1vZGVsLFxuICAgICAgZXh0ZXJuYWw6ICEhc3RvcmFnZSxcbiAgICAgIGVudW1lcmFibGUsXG4gICAgICBuZXN0ZWQ6ICFlbnVtZXJhYmxlICYmIG5lc3RlZCxcbiAgICAgIHBsYWNlaG9sZGVyOiBpZCA9PlxuICAgICAgICBPYmplY3QuZnJlZXplKE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShwbGFjZWhvbGRlciksIHsgaWQgfSkpLFxuICAgICAgaXNJbnN0YW5jZTogbW9kZWwgPT4gT2JqZWN0LmdldFByb3RvdHlwZU9mKG1vZGVsKSAhPT0gcGxhY2Vob2xkZXIsXG4gICAgICBpbnZhbGlkYXRlOiAoKSA9PiB7XG4gICAgICAgIGlmICghaW52YWxpZGF0ZVByb21pc2UpIHtcbiAgICAgICAgICBpbnZhbGlkYXRlUHJvbWlzZSA9IHJlc29sdmVkUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNhY2hlLmludmFsaWRhdGUoY29uZmlnLCBjb25maWcsIHRydWUpO1xuICAgICAgICAgICAgaW52YWxpZGF0ZVByb21pc2UgPSBudWxsO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY2hlY2tzLFxuICAgIH07XG5cbiAgICBjb25maWcuc3RvcmFnZSA9IHNldHVwU3RvcmFnZShzdG9yYWdlIHx8IG1lbW9yeVN0b3JhZ2UoY29uZmlnLCBNb2RlbCkpO1xuXG4gICAgY29uc3QgdHJhbnNmb3JtID0gT2JqZWN0LmtleXMoT2JqZWN0LmZyZWV6ZShNb2RlbCkpXG4gICAgICAuZmlsdGVyKGtleSA9PiBrZXkgIT09IGNvbm5lY3QpXG4gICAgICAubWFwKGtleSA9PiB7XG4gICAgICAgIGlmIChrZXkgIT09IFwiaWRcIikge1xuICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwbGFjZWhvbGRlciwga2V5LCB7XG4gICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgIGBNb2RlbCBpbnN0YW5jZSBpbiAke1xuICAgICAgICAgICAgICAgICAgZ2V0TW9kZWxTdGF0ZSh0aGlzKS5zdGF0ZVxuICAgICAgICAgICAgICAgIH0gc3RhdGUgLSB1c2Ugc3RvcmUucGVuZGluZygpLCBzdG9yZS5lcnJvcigpLCBvciBzdG9yZS5yZWFkeSgpIGd1YXJkc2AsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChrZXkgPT09IFwiaWRcIikge1xuICAgICAgICAgIGlmIChNb2RlbFtrZXldICE9PSB0cnVlKSB7XG4gICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgIFwiVGhlICdpZCcgcHJvcGVydHkgaW4gbW9kZWwgZGVmaW5pdGlvbiBtdXN0IGJlIHNldCB0byAndHJ1ZScgb3Igbm90IGJlIGRlZmluZWRcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAobW9kZWwsIGRhdGEsIGxhc3RNb2RlbCkgPT4ge1xuICAgICAgICAgICAgbGV0IGlkO1xuICAgICAgICAgICAgaWYgKGxhc3RNb2RlbCkge1xuICAgICAgICAgICAgICBpZCA9IGxhc3RNb2RlbC5pZDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBcImlkXCIpKSB7XG4gICAgICAgICAgICAgIGlkID0gU3RyaW5nKGRhdGEuaWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWQgPSB1dWlkKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2RlbCwgXCJpZFwiLCB7IHZhbHVlOiBpZCwgZW51bWVyYWJsZTogdHJ1ZSB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyBkZWZhdWx0VmFsdWUsIHR5cGUgfSA9IHJlc29sdmVLZXkoTW9kZWwsIGtleSwgY29uZmlnKTtcblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgICAgICAgIHJldHVybiBtb2RlbCA9PiB7XG4gICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShtb2RlbCwga2V5LCB7XG4gICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlLmdldCh0aGlzLCBrZXksIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIGNhc2UgXCJvYmplY3RcIjoge1xuICAgICAgICAgICAgaWYgKGRlZmF1bHRWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgYFRoZSB2YWx1ZSBmb3IgdGhlICcke2tleX0nIG11c3QgYmUgYW4gb2JqZWN0IGluc3RhbmNlOiAke2RlZmF1bHRWYWx1ZX1gLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheShkZWZhdWx0VmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRUeXBlID0gdHlwZW9mIGRlZmF1bHRWYWx1ZVswXTtcblxuICAgICAgICAgICAgICBpZiAobmVzdGVkVHlwZSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IENvbnN0cnVjdG9yID0gZ2V0VHlwZUNvbnN0cnVjdG9yKG5lc3RlZFR5cGUsIGtleSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdEFycmF5ID0gT2JqZWN0LmZyZWV6ZShcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZS5tYXAoQ29uc3RydWN0b3IpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChtb2RlbCwgZGF0YSwgbGFzdE1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkYXRhW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgYFRoZSB2YWx1ZSBmb3IgJyR7a2V5fScgcHJvcGVydHkgbXVzdCBiZSBhbiBhcnJheTogJHt0eXBlb2YgZGF0YVtcbiAgICAgICAgICAgICAgICAgICAgICAgICAga2V5XG4gICAgICAgICAgICAgICAgICAgICAgICBdfWAsXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtb2RlbFtrZXldID0gT2JqZWN0LmZyZWV6ZShkYXRhW2tleV0ubWFwKENvbnN0cnVjdG9yKSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RNb2RlbCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGxhc3RNb2RlbCwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBtb2RlbFtrZXldID0gbGFzdE1vZGVsW2tleV07XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtb2RlbFtrZXldID0gZGVmYXVsdEFycmF5O1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBsb2NhbENvbmZpZyA9IGJvb3RzdHJhcChkZWZhdWx0VmFsdWUsIHRydWUpO1xuXG4gICAgICAgICAgICAgIGlmIChsb2NhbENvbmZpZy5lbnVtZXJhYmxlICYmIGRlZmF1bHRWYWx1ZVsxXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5lc3RlZE9wdGlvbnMgPSBkZWZhdWx0VmFsdWVbMV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXN0ZWRPcHRpb25zICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGBPcHRpb25zIGZvciAnJHtrZXl9JyBhcnJheSBwcm9wZXJ0eSBtdXN0IGJlIGFuIG9iamVjdCBpbnN0YW5jZTogJHt0eXBlb2YgbmVzdGVkT3B0aW9uc31gLFxuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5lc3RlZE9wdGlvbnMubG9vc2UpIHtcbiAgICAgICAgICAgICAgICAgIGNvbmZpZy5jb250ZXh0cyA9IGNvbmZpZy5jb250ZXh0cyB8fCBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgICBjb25maWcuY29udGV4dHMuYWRkKGJvb3RzdHJhcChkZWZhdWx0VmFsdWVbMF0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIChtb2RlbCwgZGF0YSwgbGFzdE1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRhdGFba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgIGBUaGUgdmFsdWUgZm9yICcke2tleX0nIHByb3BlcnR5IG11c3QgYmUgYW4gYXJyYXk6ICR7dHlwZW9mIGRhdGFbXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlcbiAgICAgICAgICAgICAgICAgICAgICBdfWAsXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBtb2RlbFtrZXldID0gbG9jYWxDb25maWcuY3JlYXRlKGRhdGFba2V5XSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIG1vZGVsW2tleV0gPVxuICAgICAgICAgICAgICAgICAgICAobGFzdE1vZGVsICYmIGxhc3RNb2RlbFtrZXldKSB8fFxuICAgICAgICAgICAgICAgICAgICAoIWxvY2FsQ29uZmlnLmVudW1lcmFibGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICBsb2NhbENvbmZpZy5jcmVhdGUoZGVmYXVsdFZhbHVlKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBuZXN0ZWRDb25maWcgPSBib290c3RyYXAoZGVmYXVsdFZhbHVlLCB0cnVlKTtcbiAgICAgICAgICAgIGlmIChuZXN0ZWRDb25maWcuZW51bWVyYWJsZSB8fCBuZXN0ZWRDb25maWcuZXh0ZXJuYWwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIChtb2RlbCwgZGF0YSwgbGFzdE1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdE1vZGVsO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkRGF0YSA9IGRhdGFba2V5XTtcblxuICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXN0ZWREYXRhICE9PSBcIm9iamVjdFwiIHx8IG5lc3RlZERhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5lc3RlZERhdGEgIT09IHVuZGVmaW5lZCAmJiBuZXN0ZWREYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVzdWx0TW9kZWwgPSB7IGlkOiBuZXN0ZWREYXRhIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGFDb25maWcgPSBkZWZpbml0aW9ucy5nZXQobmVzdGVkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhQ29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFDb25maWcubW9kZWwgIT09IGRlZmF1bHRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBcIk1vZGVsIGluc3RhbmNlIG11c3QgbWF0Y2ggdGhlIGRlZmluaXRpb25cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdE1vZGVsID0gbmVzdGVkRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXN1bHRNb2RlbCA9IG5lc3RlZENvbmZpZy5jcmVhdGUobmVzdGVkRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgc3luYyhuZXN0ZWRDb25maWcsIHJlc3VsdE1vZGVsLmlkLCByZXN1bHRNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmVzdWx0TW9kZWwgPSBsYXN0TW9kZWwgJiYgbGFzdE1vZGVsW2tleV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdE1vZGVsKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBpZCA9IHJlc3VsdE1vZGVsLmlkO1xuICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZGVsLCBrZXksIHtcbiAgICAgICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZS5nZXQoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGVuZGluZyh0aGlzKSA/IF8gOiAoKSA9PiBnZXQoZGVmYXVsdFZhbHVlLCBpZCksXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBtb2RlbFtrZXldID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIChtb2RlbCwgZGF0YSwgbGFzdE1vZGVsKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGtleSkpIHtcbiAgICAgICAgICAgICAgICBtb2RlbFtrZXldID0gbmVzdGVkQ29uZmlnLmNyZWF0ZShcbiAgICAgICAgICAgICAgICAgIGRhdGFba2V5XSxcbiAgICAgICAgICAgICAgICAgIGxhc3RNb2RlbCAmJiBsYXN0TW9kZWxba2V5XSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1vZGVsW2tleV0gPSBsYXN0TW9kZWxcbiAgICAgICAgICAgICAgICAgID8gbGFzdE1vZGVsW2tleV1cbiAgICAgICAgICAgICAgICAgIDogbmVzdGVkQ29uZmlnLmNyZWF0ZSh7fSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1mYWxsdGhyb3VnaFxuICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgIGNvbnN0IENvbnN0cnVjdG9yID0gZ2V0VHlwZUNvbnN0cnVjdG9yKHR5cGUsIGtleSk7XG4gICAgICAgICAgICByZXR1cm4gKG1vZGVsLCBkYXRhLCBsYXN0TW9kZWwpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSkge1xuICAgICAgICAgICAgICAgIG1vZGVsW2tleV0gPSBDb25zdHJ1Y3RvcihkYXRhW2tleV0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RNb2RlbCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGxhc3RNb2RlbCwga2V5KSkge1xuICAgICAgICAgICAgICAgIG1vZGVsW2tleV0gPSBsYXN0TW9kZWxba2V5XTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtb2RlbFtrZXldID0gZGVmYXVsdFZhbHVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBjb25maWcuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGRhdGEsIGxhc3RNb2RlbCkge1xuICAgICAgaWYgKGRhdGEgPT09IG51bGwpIHJldHVybiBudWxsO1xuXG4gICAgICBpZiAodHlwZW9mIGRhdGEgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKGBNb2RlbCB2YWx1ZXMgbXVzdCBiZSBhbiBvYmplY3QgaW5zdGFuY2U6ICR7ZGF0YX1gKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbW9kZWwgPSB0cmFuc2Zvcm0ucmVkdWNlKChhY2MsIGZuKSA9PiB7XG4gICAgICAgIGZuKGFjYywgZGF0YSwgbGFzdE1vZGVsKTtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sIHt9KTtcblxuICAgICAgZGVmaW5pdGlvbnMuc2V0KG1vZGVsLCBjb25maWcpO1xuICAgICAgc3RvcmVQb2ludGVyLnNldChtb2RlbCwgc3RvcmUpO1xuXG4gICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShtb2RlbCk7XG4gICAgfTtcblxuICAgIE9iamVjdC5mcmVlemUocGxhY2Vob2xkZXIpO1xuXG4gICAgY29uZmlncy5zZXQoTW9kZWwsIE9iamVjdC5mcmVlemUoY29uZmlnKSk7XG4gIH1cblxuICByZXR1cm4gY29uZmlnO1xufVxuXG5jb25zdCBsaXN0UGxhY2Vob2xkZXJQcm90b3R5cGUgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhcbiAgQXJyYXkucHJvdG90eXBlLFxuKS5yZWR1Y2UoKGFjYywga2V5KSA9PiB7XG4gIGlmIChrZXkgPT09IFwibGVuZ3RoXCIgfHwga2V5ID09PSBcImNvbnN0cnVjdG9yXCIpIHJldHVybiBhY2M7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGFjYywga2V5LCB7XG4gICAgZ2V0KCkge1xuICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgIGBNb2RlbCBsaXN0IGluc3RhbmNlIGluICR7XG4gICAgICAgICAgZ2V0TW9kZWxTdGF0ZSh0aGlzKS5zdGF0ZVxuICAgICAgICB9IHN0YXRlIC0gdXNlIHN0b3JlLnBlbmRpbmcoKSwgc3RvcmUuZXJyb3IoKSwgb3Igc3RvcmUucmVhZHkoKSBndWFyZHNgLFxuICAgICAgKTtcbiAgICB9LFxuICB9KTtcbiAgcmV0dXJuIGFjYztcbn0sIFtdKTtcblxuY29uc3QgbGlzdHMgPSBuZXcgV2Vha01hcCgpO1xuZnVuY3Rpb24gc2V0dXBMaXN0TW9kZWwoTW9kZWwsIG5lc3RlZCkge1xuICBsZXQgY29uZmlnID0gbGlzdHMuZ2V0KE1vZGVsKTtcblxuICBpZiAoY29uZmlnICYmICFjb25maWcuZW51bWVyYWJsZSkge1xuICAgIGlmICghbmVzdGVkICYmIGNvbmZpZy5uZXN0ZWQpIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICAgc3RyaW5naWZ5TW9kZWwoXG4gICAgICAgICAgTW9kZWwsXG4gICAgICAgICAgXCJOZXN0ZWQgbW9kZWwgZGVmaW5pdGlvbiBjYW5ub3QgYmUgdXNlZCBvdXRzaWRlIG9mIHRoZSBwYXJlbnQgZGVmaW5pdGlvblwiLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbmZpZykge1xuICAgIGNvbnN0IG1vZGVsQ29uZmlnID0gc2V0dXBNb2RlbChNb2RlbCk7XG5cbiAgICBjb25zdCBjb250ZXh0cyA9IG5ldyBTZXQoKTtcbiAgICBjb250ZXh0cy5hZGQobW9kZWxDb25maWcpO1xuXG4gICAgaWYgKCFuZXN0ZWQpIHtcbiAgICAgIGlmICghbW9kZWxDb25maWcuZW51bWVyYWJsZSkge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAgICAgc3RyaW5naWZ5TW9kZWwoXG4gICAgICAgICAgICBNb2RlbCxcbiAgICAgICAgICAgIFwiUHJvdmlkZWQgbW9kZWwgZGVmaW5pdGlvbiBkb2VzIG5vdCBzdXBwb3J0IGxpc3RpbmcgKGl0IG11c3QgYmUgZW51bWVyYWJsZSAtIHNldCBgaWRgIHByb3BlcnR5IHRvIGB0cnVlYClcIixcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKCFtb2RlbENvbmZpZy5zdG9yYWdlLmxpc3QpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgICAgIHN0cmluZ2lmeU1vZGVsKFxuICAgICAgICAgICAgTW9kZWwsXG4gICAgICAgICAgICBcIlByb3ZpZGVkIG1vZGVsIGRlZmluaXRpb24gc3RvcmFnZSBkb2VzIG5vdCBzdXBwb3J0IGBsaXN0YCBhY3Rpb25cIixcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbmZpZyA9IHtcbiAgICAgIGxpc3Q6IHRydWUsXG4gICAgICBuZXN0ZWQ6ICFtb2RlbENvbmZpZy5lbnVtZXJhYmxlICYmIG5lc3RlZCxcbiAgICAgIG1vZGVsOiBNb2RlbCxcbiAgICAgIGNvbnRleHRzLFxuICAgICAgZW51bWVyYWJsZTogbW9kZWxDb25maWcuZW51bWVyYWJsZSxcbiAgICAgIHN0b3JhZ2U6IHNldHVwU3RvcmFnZSh7XG4gICAgICAgIGNhY2hlOiBtb2RlbENvbmZpZy5zdG9yYWdlLmNhY2hlLFxuICAgICAgICBnZXQ6XG4gICAgICAgICAgIW5lc3RlZCAmJlxuICAgICAgICAgIChpZCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbW9kZWxDb25maWcuc3RvcmFnZS5saXN0KGlkKTtcbiAgICAgICAgICB9KSxcbiAgICAgIH0pLFxuICAgICAgcGxhY2Vob2xkZXI6ICgpID0+IE9iamVjdC5mcmVlemUoT2JqZWN0LmNyZWF0ZShsaXN0UGxhY2Vob2xkZXJQcm90b3R5cGUpKSxcbiAgICAgIGlzSW5zdGFuY2U6IG1vZGVsID0+XG4gICAgICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZihtb2RlbCkgIT09IGxpc3RQbGFjZWhvbGRlclByb3RvdHlwZSxcbiAgICAgIGNyZWF0ZShpdGVtcykge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBpdGVtcy5yZWR1Y2UoKGFjYywgZGF0YSkgPT4ge1xuICAgICAgICAgIGxldCBpZCA9IGRhdGE7XG4gICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiICYmIGRhdGEgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGlkID0gZGF0YS5pZDtcbiAgICAgICAgICAgIGNvbnN0IGRhdGFDb25maWcgPSBkZWZpbml0aW9ucy5nZXQoZGF0YSk7XG4gICAgICAgICAgICBsZXQgbW9kZWwgPSBkYXRhO1xuICAgICAgICAgICAgaWYgKGRhdGFDb25maWcpIHtcbiAgICAgICAgICAgICAgaWYgKGRhdGFDb25maWcubW9kZWwgIT09IE1vZGVsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiTW9kZWwgaW5zdGFuY2UgbXVzdCBtYXRjaCB0aGUgZGVmaW5pdGlvblwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbW9kZWwgPSBtb2RlbENvbmZpZy5jcmVhdGUoZGF0YSk7XG4gICAgICAgICAgICAgIGlmIChtb2RlbENvbmZpZy5lbnVtZXJhYmxlKSB7XG4gICAgICAgICAgICAgICAgaWQgPSBtb2RlbC5pZDtcbiAgICAgICAgICAgICAgICBzeW5jKG1vZGVsQ29uZmlnLCBpZCwgbW9kZWwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW1vZGVsQ29uZmlnLmVudW1lcmFibGUpIHtcbiAgICAgICAgICAgICAgYWNjLnB1c2gobW9kZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoIW1vZGVsQ29uZmlnLmVudW1lcmFibGUpIHtcbiAgICAgICAgICAgIHRocm93IFR5cGVFcnJvcihgTW9kZWwgaW5zdGFuY2UgbXVzdCBiZSBhbiBvYmplY3Q6ICR7dHlwZW9mIGRhdGF9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtb2RlbENvbmZpZy5lbnVtZXJhYmxlKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBhY2MubGVuZ3RoO1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGFjYywga2V5LCB7XG4gICAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGUuZ2V0KFxuICAgICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgICAgICAgIHBlbmRpbmcodGhpcykgPyBfIDogKCkgPT4gZ2V0KE1vZGVsLCBpZCksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LCBbXSk7XG5cbiAgICAgICAgZGVmaW5pdGlvbnMuc2V0KHJlc3VsdCwgY29uZmlnKTtcbiAgICAgICAgc3RvcmVQb2ludGVyLnNldChyZXN1bHQsIHN0b3JlKTtcblxuICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShyZXN1bHQpO1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgbGlzdHMuc2V0KE1vZGVsLCBPYmplY3QuZnJlZXplKGNvbmZpZykpO1xuICB9XG5cbiAgcmV0dXJuIGNvbmZpZztcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVRpbWVzdGFtcChoLCB2KSB7XG4gIHJldHVybiB2IHx8IGdldEN1cnJlbnRUaW1lc3RhbXAoKTtcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5SWQoaWQpIHtcbiAgc3dpdGNoICh0eXBlb2YgaWQpIHtcbiAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgIE9iamVjdC5rZXlzKGlkKVxuICAgICAgICAgIC5zb3J0KClcbiAgICAgICAgICAucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBpZFtrZXldID09PSBcIm9iamVjdFwiICYmIGlkW2tleV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIGBZb3UgbXVzdCB1c2UgcHJpbWl0aXZlIHZhbHVlIGZvciAnJHtrZXl9JyBrZXk6ICR7dHlwZW9mIGlkW1xuICAgICAgICAgICAgICAgICAga2V5XG4gICAgICAgICAgICAgICAgXX1gLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWNjW2tleV0gPSBpZFtrZXldO1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICB9LCB7fSksXG4gICAgICApO1xuICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBTdHJpbmcoaWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hcEVycm9yKG1vZGVsLCBlcnIsIHN1cHByZXNzTG9nKSB7XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgJiYgc3VwcHJlc3NMb2cgIT09IGZhbHNlKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gIH1cblxuICByZXR1cm4gc2V0TW9kZWxTdGF0ZShtb2RlbCwgXCJlcnJvclwiLCBlcnIpO1xufVxuXG5mdW5jdGlvbiBnZXQoTW9kZWwsIGlkKSB7XG4gIGNvbnN0IGNvbmZpZyA9IGJvb3RzdHJhcChNb2RlbCk7XG4gIGxldCBzdHJpbmdJZDtcblxuICBpZiAoIWNvbmZpZy5zdG9yYWdlLmdldCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgIHN0cmluZ2lmeU1vZGVsKFxuICAgICAgICBNb2RlbCxcbiAgICAgICAgXCJQcm92aWRlZCBtb2RlbCBkZWZpbml0aW9uIGRvZXMgbm90IHN1cHBvcnQgJ2dldCcgbWV0aG9kXCIsXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBpZiAoY29uZmlnLmVudW1lcmFibGUpIHtcbiAgICBzdHJpbmdJZCA9IHN0cmluZ2lmeUlkKGlkKTtcblxuICAgIGlmICghY29uZmlnLmxpc3QgJiYgIXN0cmluZ0lkKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAgIHN0cmluZ2lmeU1vZGVsKFxuICAgICAgICAgIE1vZGVsLFxuICAgICAgICAgIGBQcm92aWRlZCBtb2RlbCBkZWZpbml0aW9uIHJlcXVpcmVzIG5vbi1lbXB0eSBpZDogXCIke3N0cmluZ0lkfVwiYCxcbiAgICAgICAgKSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICBzdHJpbmdpZnlNb2RlbChNb2RlbCwgXCJQcm92aWRlZCBtb2RlbCBkZWZpbml0aW9uIGRvZXMgbm90IHN1cHBvcnQgaWRcIiksXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBjYWNoZS5nZXQoXG4gICAgY29uZmlnLFxuICAgIHN0cmluZ0lkLFxuICAgIChoLCBjYWNoZWRNb2RlbCkgPT4ge1xuICAgICAgaWYgKGNhY2hlZE1vZGVsICYmIHBlbmRpbmcoY2FjaGVkTW9kZWwpKSByZXR1cm4gY2FjaGVkTW9kZWw7XG5cbiAgICAgIGxldCB2YWxpZENvbnRleHRzID0gdHJ1ZTtcbiAgICAgIGlmIChjb25maWcuY29udGV4dHMpIHtcbiAgICAgICAgY29uZmlnLmNvbnRleHRzLmZvckVhY2goY29udGV4dCA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgY2FjaGUuZ2V0KGNvbnRleHQsIGNvbnRleHQsIHJlc29sdmVUaW1lc3RhbXApID09PVxuICAgICAgICAgICAgZ2V0Q3VycmVudFRpbWVzdGFtcCgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB2YWxpZENvbnRleHRzID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICB2YWxpZENvbnRleHRzICYmXG4gICAgICAgIGNhY2hlZE1vZGVsICYmXG4gICAgICAgIChjb25maWcuc3RvcmFnZS5jYWNoZSA9PT0gdHJ1ZSB8fCBjb25maWcuc3RvcmFnZS52YWxpZGF0ZShjYWNoZWRNb2RlbCkpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGNhY2hlZE1vZGVsO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gY29uZmlnLnN0b3JhZ2UuZ2V0KGlkKTtcblxuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJvYmplY3RcIiB8fCByZXN1bHQgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICAgIGBNb2RlbCBpbnN0YW5jZSAke1xuICAgICAgICAgICAgICBzdHJpbmdJZCAhPT0gdW5kZWZpbmVkID8gYHdpdGggJyR7c3RyaW5nSWR9JyBpZGAgOiBcIlwiXG4gICAgICAgICAgICB9IGRvZXMgbm90IGV4aXN0YCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgICByZXN1bHQgPSByZXN1bHRcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgIT09IFwib2JqZWN0XCIgfHwgZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgICAgICAgICAgYE1vZGVsIGluc3RhbmNlICR7XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZ0lkICE9PSB1bmRlZmluZWQgPyBgd2l0aCAnJHtzdHJpbmdJZH0nIGlkYCA6IFwiXCJcbiAgICAgICAgICAgICAgICAgIH0gZG9lcyBub3QgZXhpc3RgLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gc3luYyhcbiAgICAgICAgICAgICAgICBjb25maWcsXG4gICAgICAgICAgICAgICAgc3RyaW5nSWQsXG4gICAgICAgICAgICAgICAgY29uZmlnLmNyZWF0ZShzdHJpbmdJZCA/IHsgLi4uZGF0YSwgaWQ6IHN0cmluZ0lkIH0gOiBkYXRhKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBzeW5jKFxuICAgICAgICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICAgICAgICBzdHJpbmdJZCxcbiAgICAgICAgICAgICAgICBtYXBFcnJvcihjYWNoZWRNb2RlbCB8fCBjb25maWcucGxhY2Vob2xkZXIoc3RyaW5nSWQpLCBlKSxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHNldE1vZGVsU3RhdGUoXG4gICAgICAgICAgICBjYWNoZWRNb2RlbCB8fCBjb25maWcucGxhY2Vob2xkZXIoc3RyaW5nSWQpLFxuICAgICAgICAgICAgXCJwZW5kaW5nXCIsXG4gICAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjYWNoZWRNb2RlbCkgZGVmaW5pdGlvbnMuc2V0KGNhY2hlZE1vZGVsLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVzdGFtcChcbiAgICAgICAgICBjb25maWcuY3JlYXRlKHN0cmluZ0lkID8geyAuLi5yZXN1bHQsIGlkOiBzdHJpbmdJZCB9IDogcmVzdWx0KSxcbiAgICAgICAgKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVzdGFtcChcbiAgICAgICAgICBtYXBFcnJvcihjYWNoZWRNb2RlbCB8fCBjb25maWcucGxhY2Vob2xkZXIoc3RyaW5nSWQpLCBlKSxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGNvbmZpZy5zdG9yYWdlLnZhbGlkYXRlLFxuICApO1xufVxuXG5jb25zdCBkcmFmdE1hcCA9IG5ldyBXZWFrTWFwKCk7XG5cbmZ1bmN0aW9uIGdldFZhbGlkYXRpb25FcnJvcihlcnJvcnMpIHtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGVycm9ycyk7XG4gIGNvbnN0IGUgPSBFcnJvcihcbiAgICBgTW9kZWwgdmFsaWRhdGlvbiBmYWlsZWQgKCR7a2V5cy5qb2luKFxuICAgICAgXCIsIFwiLFxuICAgICl9KSAtIHJlYWQgdGhlIGRldGFpbHMgZnJvbSAnZXJyb3JzJyBwcm9wZXJ0eWAsXG4gICk7XG5cbiAgZS5lcnJvcnMgPSBlcnJvcnM7XG5cbiAgcmV0dXJuIGU7XG59XG5cbmZ1bmN0aW9uIHNldChtb2RlbCwgdmFsdWVzID0ge30pIHtcbiAgbGV0IGNvbmZpZyA9IGRlZmluaXRpb25zLmdldChtb2RlbCk7XG4gIGNvbnN0IGlzSW5zdGFuY2UgPSAhIWNvbmZpZztcblxuICBpZiAoY29uZmlnID09PSBudWxsKSB7XG4gICAgdGhyb3cgRXJyb3IoXG4gICAgICBcIlByb3ZpZGVkIG1vZGVsIGluc3RhbmNlIGhhcyBleHBpcmVkLiBIYXZlbid0IHlvdSB1c2VkIHN0YWxlIHZhbHVlP1wiLFxuICAgICk7XG4gIH1cblxuICBpZiAoIWNvbmZpZykgY29uZmlnID0gYm9vdHN0cmFwKG1vZGVsKTtcblxuICBpZiAoY29uZmlnLm5lc3RlZCkge1xuICAgIHRocm93IHN0cmluZ2lmeU1vZGVsKFxuICAgICAgY29uZmlnLm1vZGVsLFxuICAgICAgVHlwZUVycm9yKFxuICAgICAgICBcIlNldHRpbmcgcHJvdmlkZWQgbmVzdGVkIG1vZGVsIGluc3RhbmNlIGlzIG5vdCBzdXBwb3J0ZWQsIHVzZSB0aGUgcm9vdCBtb2RlbCBpbnN0YW5jZVwiLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgaWYgKGNvbmZpZy5saXN0KSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFwiTGlzdGluZyBtb2RlbCBkZWZpbml0aW9uIGRvZXMgbm90IHN1cHBvcnQgJ3NldCcgbWV0aG9kXCIpO1xuICB9XG5cbiAgaWYgKCFjb25maWcuc3RvcmFnZS5zZXQpIHtcbiAgICB0aHJvdyBzdHJpbmdpZnlNb2RlbChcbiAgICAgIGNvbmZpZy5tb2RlbCxcbiAgICAgIFR5cGVFcnJvcihcbiAgICAgICAgXCJQcm92aWRlZCBtb2RlbCBkZWZpbml0aW9uIHN0b3JhZ2UgZG9lcyBub3Qgc3VwcG9ydCAnc2V0JyBtZXRob2RcIixcbiAgICAgICksXG4gICAgKTtcbiAgfVxuXG4gIGlmIChpc0luc3RhbmNlICYmIHBlbmRpbmcobW9kZWwpKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJQcm92aWRlZCBtb2RlbCBpbnN0YW5jZSBpcyBpbiBwZW5kaW5nIHN0YXRlXCIpO1xuICB9XG5cbiAgbGV0IGlkO1xuICBjb25zdCBzZXRTdGF0ZSA9IChzdGF0ZSwgdmFsdWUpID0+IHtcbiAgICBpZiAoaXNJbnN0YW5jZSkge1xuICAgICAgc2V0TW9kZWxTdGF0ZShtb2RlbCwgc3RhdGUsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZW50cnkgPSBjYWNoZS5nZXRFbnRyeShjb25maWcsIGlkKTtcbiAgICAgIGlmIChlbnRyeS52YWx1ZSkge1xuICAgICAgICBzZXRNb2RlbFN0YXRlKGVudHJ5LnZhbHVlLCBzdGF0ZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB0cnkge1xuICAgIGlmIChcbiAgICAgIGNvbmZpZy5lbnVtZXJhYmxlICYmXG4gICAgICAhaXNJbnN0YW5jZSAmJlxuICAgICAgKCF2YWx1ZXMgfHwgdHlwZW9mIHZhbHVlcyAhPT0gXCJvYmplY3RcIilcbiAgICApIHtcbiAgICAgIHRocm93IFR5cGVFcnJvcihgVmFsdWVzIG11c3QgYmUgYW4gb2JqZWN0IGluc3RhbmNlOiAke3ZhbHVlc31gKTtcbiAgICB9XG5cbiAgICBpZiAodmFsdWVzICYmIGhhc093blByb3BlcnR5LmNhbGwodmFsdWVzLCBcImlkXCIpKSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoYFZhbHVlcyBtdXN0IG5vdCBjb250YWluICdpZCcgcHJvcGVydHk6ICR7dmFsdWVzLmlkfWApO1xuICAgIH1cblxuICAgIGNvbnN0IGxvY2FsTW9kZWwgPSBjb25maWcuY3JlYXRlKHZhbHVlcywgaXNJbnN0YW5jZSA/IG1vZGVsIDogdW5kZWZpbmVkKTtcbiAgICBjb25zdCBrZXlzID0gdmFsdWVzID8gT2JqZWN0LmtleXModmFsdWVzKSA6IFtdO1xuICAgIGNvbnN0IGlzRHJhZnQgPSBkcmFmdE1hcC5nZXQoY29uZmlnKTtcbiAgICBjb25zdCBlcnJvcnMgPSB7fTtcbiAgICBjb25zdCBsYXN0RXJyb3IgPSBpc0luc3RhbmNlICYmIGlzRHJhZnQgJiYgZXJyb3IobW9kZWwpO1xuXG4gICAgbGV0IGhhc0Vycm9ycyA9IGZhbHNlO1xuXG4gICAgaWYgKGxvY2FsTW9kZWwpIHtcbiAgICAgIGNvbmZpZy5jaGVja3MuZm9yRWFjaCgoZm4sIGtleSkgPT4ge1xuICAgICAgICBpZiAoa2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSB7XG4gICAgICAgICAgaWYgKGxhc3RFcnJvciAmJiBsYXN0RXJyb3IuZXJyb3JzICYmIGxhc3RFcnJvci5lcnJvcnNba2V5XSkge1xuICAgICAgICAgICAgaGFzRXJyb3JzID0gdHJ1ZTtcbiAgICAgICAgICAgIGVycm9yc1trZXldID0gbGFzdEVycm9yLmVycm9yc1trZXldO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcbiAgICAgICAgICBpZiAoaXNEcmFmdCAmJiBsb2NhbE1vZGVsW2tleV0gPT0gY29uZmlnLm1vZGVsW2tleV0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY2hlY2tSZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY2hlY2tSZXN1bHQgPSBmbihsb2NhbE1vZGVsW2tleV0sIGtleSwgbG9jYWxNb2RlbCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjaGVja1Jlc3VsdCA9IGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hlY2tSZXN1bHQgIT09IHRydWUgJiYgY2hlY2tSZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGhhc0Vycm9ycyA9IHRydWU7XG4gICAgICAgICAgZXJyb3JzW2tleV0gPSBjaGVja1Jlc3VsdCB8fCB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKGhhc0Vycm9ycyAmJiAhaXNEcmFmdCkge1xuICAgICAgICB0aHJvdyBnZXRWYWxpZGF0aW9uRXJyb3IoZXJyb3JzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZCA9IGxvY2FsTW9kZWwgPyBsb2NhbE1vZGVsLmlkIDogbW9kZWwuaWQ7XG5cbiAgICBjb25zdCByZXN1bHQgPSBQcm9taXNlLnJlc29sdmUoXG4gICAgICBjb25maWcuc3RvcmFnZS5zZXQoaXNJbnN0YW5jZSA/IGlkIDogdW5kZWZpbmVkLCBsb2NhbE1vZGVsLCBrZXlzKSxcbiAgICApXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0TW9kZWwgPVxuICAgICAgICAgIGRhdGEgPT09IGxvY2FsTW9kZWwgPyBsb2NhbE1vZGVsIDogY29uZmlnLmNyZWF0ZShkYXRhKTtcblxuICAgICAgICBpZiAoaXNJbnN0YW5jZSAmJiByZXN1bHRNb2RlbCAmJiBpZCAhPT0gcmVzdWx0TW9kZWwuaWQpIHtcbiAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBgTG9jYWwgYW5kIHN0b3JhZ2UgZGF0YSBtdXN0IGhhdmUgdGhlIHNhbWUgaWQ6ICcke2lkfScsICcke3Jlc3VsdE1vZGVsLmlkfSdgLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHRJZCA9IHJlc3VsdE1vZGVsID8gcmVzdWx0TW9kZWwuaWQgOiBpZDtcblxuICAgICAgICBpZiAoaGFzRXJyb3JzICYmIGlzRHJhZnQpIHtcbiAgICAgICAgICBzZXRNb2RlbFN0YXRlKHJlc3VsdE1vZGVsLCBcImVycm9yXCIsIGdldFZhbGlkYXRpb25FcnJvcihlcnJvcnMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzeW5jKFxuICAgICAgICAgIGNvbmZpZyxcbiAgICAgICAgICByZXN1bHRJZCxcbiAgICAgICAgICByZXN1bHRNb2RlbCB8fFxuICAgICAgICAgICAgbWFwRXJyb3IoXG4gICAgICAgICAgICAgIGNvbmZpZy5wbGFjZWhvbGRlcihyZXN1bHRJZCksXG4gICAgICAgICAgICAgIEVycm9yKFxuICAgICAgICAgICAgICAgIGBNb2RlbCBpbnN0YW5jZSAke1xuICAgICAgICAgICAgICAgICAgaWQgIT09IHVuZGVmaW5lZCA/IGB3aXRoICcke2lkfScgaWRgIDogXCJcIlxuICAgICAgICAgICAgICAgIH0gZG9lcyBub3QgZXhpc3RgLFxuICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgdHJ1ZSxcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgZXJyID0gZXJyICE9PSB1bmRlZmluZWQgPyBlcnIgOiBFcnJvcihcIlVuZGVmaW5lZCBlcnJvclwiKTtcbiAgICAgICAgc2V0U3RhdGUoXCJlcnJvclwiLCBlcnIpO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9KTtcblxuICAgIHNldFN0YXRlKFwicGVuZGluZ1wiLCByZXN1bHQpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHNldFN0YXRlKFwiZXJyb3JcIiwgZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFyKG1vZGVsLCBjbGVhclZhbHVlID0gdHJ1ZSkge1xuICBpZiAodHlwZW9mIG1vZGVsICE9PSBcIm9iamVjdFwiIHx8IG1vZGVsID09PSBudWxsKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgYFRoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgbW9kZWwgaW5zdGFuY2Ugb3IgYSBtb2RlbCBkZWZpbml0aW9uOiAke21vZGVsfWAsXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGNvbmZpZyA9IGRlZmluaXRpb25zLmdldChtb2RlbCk7XG5cbiAgaWYgKGNvbmZpZyA9PT0gbnVsbCkge1xuICAgIHRocm93IEVycm9yKFxuICAgICAgXCJQcm92aWRlZCBtb2RlbCBpbnN0YW5jZSBoYXMgZXhwaXJlZC4gSGF2ZW4ndCB5b3UgdXNlZCBzdGFsZSB2YWx1ZSBmcm9tIHRoZSBvdXRlciBzY29wZT9cIixcbiAgICApO1xuICB9XG5cbiAgaWYgKGNvbmZpZykge1xuICAgIGNhY2hlLmludmFsaWRhdGUoY29uZmlnLCBtb2RlbC5pZCwgY2xlYXJWYWx1ZSwgdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKCFjb25maWdzLmdldChtb2RlbCkgJiYgIWxpc3RzLmdldChtb2RlbFswXSkpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICBcIk1vZGVsIGRlZmluaXRpb24gbXVzdCBiZSB1c2VkIGJlZm9yZSAtIHBhc3NlZCBhcmd1bWVudCBpcyBwcm9iYWJseSBub3QgYSBtb2RlbCBkZWZpbml0aW9uXCIsXG4gICAgICApO1xuICAgIH1cbiAgICBjYWNoZS5pbnZhbGlkYXRlQWxsKGJvb3RzdHJhcChtb2RlbCksIGNsZWFyVmFsdWUsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHBlbmRpbmcobW9kZWwpIHtcbiAgaWYgKG1vZGVsID09PSBudWxsIHx8IHR5cGVvZiBtb2RlbCAhPT0gXCJvYmplY3RcIikgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB7IHN0YXRlLCB2YWx1ZSB9ID0gZ2V0TW9kZWxTdGF0ZShtb2RlbCk7XG4gIHJldHVybiBzdGF0ZSA9PT0gXCJwZW5kaW5nXCIgJiYgdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGVycm9yKG1vZGVsLCBwcm9wZXJ0eSkge1xuICBpZiAobW9kZWwgPT09IG51bGwgfHwgdHlwZW9mIG1vZGVsICE9PSBcIm9iamVjdFwiKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHsgc3RhdGUsIHZhbHVlIH0gPSBnZXRNb2RlbFN0YXRlKG1vZGVsKTtcbiAgY29uc3QgcmVzdWx0ID0gc3RhdGUgPT09IFwiZXJyb3JcIiAmJiB2YWx1ZTtcblxuICBpZiAocmVzdWx0ICYmIHByb3BlcnR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcmVzdWx0LmVycm9ycyAmJiByZXN1bHQuZXJyb3JzW3Byb3BlcnR5XTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHJlYWR5KG1vZGVsKSB7XG4gIGlmIChtb2RlbCA9PT0gbnVsbCB8fCB0eXBlb2YgbW9kZWwgIT09IFwib2JqZWN0XCIpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgY29uZmlnID0gZGVmaW5pdGlvbnMuZ2V0KG1vZGVsKTtcbiAgcmV0dXJuICEhKGNvbmZpZyAmJiBjb25maWcuaXNJbnN0YW5jZShtb2RlbCkpO1xufVxuXG5mdW5jdGlvbiBtYXBWYWx1ZVdpdGhTdGF0ZShsYXN0VmFsdWUsIG5leHRWYWx1ZSkge1xuICBjb25zdCByZXN1bHQgPSBPYmplY3QuZnJlZXplKFxuICAgIE9iamVjdC5rZXlzKGxhc3RWYWx1ZSkucmVkdWNlKChhY2MsIGtleSkgPT4ge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGFjYywga2V5LCB7XG4gICAgICAgIGdldDogKCkgPT4gbGFzdFZhbHVlW2tleV0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgT2JqZWN0LmNyZWF0ZShsYXN0VmFsdWUpKSxcbiAgKTtcblxuICBkZWZpbml0aW9ucy5zZXQocmVzdWx0LCBkZWZpbml0aW9ucy5nZXQobGFzdFZhbHVlKSk7XG5cbiAgY29uc3QgeyBzdGF0ZSwgdmFsdWUgfSA9IGdldE1vZGVsU3RhdGUobmV4dFZhbHVlKTtcbiAgcmV0dXJuIHNldE1vZGVsU3RhdGUocmVzdWx0LCBzdGF0ZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBnZXRWYWx1ZXNGcm9tTW9kZWwobW9kZWwpIHtcbiAgY29uc3QgdmFsdWVzID0geyAuLi5tb2RlbCB9O1xuICBkZWxldGUgdmFsdWVzLmlkO1xuICByZXR1cm4gdmFsdWVzO1xufVxuXG5mdW5jdGlvbiBzdWJtaXQoZHJhZnQpIHtcbiAgY29uc3QgY29uZmlnID0gZGVmaW5pdGlvbnMuZ2V0KGRyYWZ0KTtcbiAgaWYgKCFjb25maWcgfHwgIWRyYWZ0TWFwLmhhcyhjb25maWcpKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKGBQcm92aWRlZCBtb2RlbCBpbnN0YW5jZSBpcyBub3QgYSBkcmFmdDogJHtkcmFmdH1gKTtcbiAgfVxuXG4gIGlmIChwZW5kaW5nKGRyYWZ0KSkge1xuICAgIHRocm93IEVycm9yKFwiTW9kZWwgZHJhZnQgaW4gcGVuZGluZyBzdGF0ZVwiKTtcbiAgfVxuXG4gIGNvbnN0IG9wdGlvbnMgPSBkcmFmdE1hcC5nZXQoY29uZmlnKTtcbiAgbGV0IHJlc3VsdDtcblxuICBpZiAoIW9wdGlvbnMuaWQpIHtcbiAgICByZXN1bHQgPSBzdG9yZS5zZXQob3B0aW9ucy5tb2RlbCwgZ2V0VmFsdWVzRnJvbU1vZGVsKGRyYWZ0KSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbW9kZWwgPSBzdG9yZS5nZXQob3B0aW9ucy5tb2RlbCwgZHJhZnQuaWQpO1xuICAgIHJlc3VsdCA9IFByb21pc2UucmVzb2x2ZShwZW5kaW5nKG1vZGVsKSB8fCBtb2RlbCkudGhlbihyZXNvbHZlZE1vZGVsID0+XG4gICAgICBzdG9yZS5zZXQocmVzb2x2ZWRNb2RlbCwgZ2V0VmFsdWVzRnJvbU1vZGVsKGRyYWZ0KSksXG4gICAgKTtcbiAgfVxuXG4gIHJlc3VsdCA9IHJlc3VsdFxuICAgIC50aGVuKHJlc3VsdE1vZGVsID0+IHtcbiAgICAgIHNldE1vZGVsU3RhdGUoZHJhZnQsIFwicmVhZHlcIik7XG4gICAgICByZXR1cm4gc3RvcmVcbiAgICAgICAgLnNldChkcmFmdCwgZ2V0VmFsdWVzRnJvbU1vZGVsKHJlc3VsdE1vZGVsKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gcmVzdWx0TW9kZWwpO1xuICAgIH0pXG4gICAgLmNhdGNoKGUgPT4ge1xuICAgICAgc2V0TW9kZWxTdGF0ZShkcmFmdCwgXCJlcnJvclwiLCBlKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlKTtcbiAgICB9KTtcblxuICBzZXRNb2RlbFN0YXRlKGRyYWZ0LCBcInBlbmRpbmdcIiwgcmVzdWx0KTtcblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiByZXF1aXJlZCh2YWx1ZSwga2V5KSB7XG4gIHJldHVybiAhIXZhbHVlIHx8IGAke2tleX0gaXMgcmVxdWlyZWRgO1xufVxuXG5mdW5jdGlvbiB2YWx1ZVdpdGhWYWxpZGF0aW9uKFxuICBkZWZhdWx0VmFsdWUsXG4gIHZhbGlkYXRlID0gcmVxdWlyZWQsXG4gIGVycm9yTWVzc2FnZSA9IFwiXCIsXG4pIHtcbiAgc3dpdGNoICh0eXBlb2YgZGVmYXVsdFZhbHVlKSB7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ldy13cmFwcGVyc1xuICAgICAgZGVmYXVsdFZhbHVlID0gbmV3IFN0cmluZyhkZWZhdWx0VmFsdWUpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ldy13cmFwcGVyc1xuICAgICAgZGVmYXVsdFZhbHVlID0gbmV3IE51bWJlcihkZWZhdWx0VmFsdWUpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICAgYERlZmF1bHQgdmFsdWUgbXVzdCBiZSBhIHN0cmluZyBvciBhIG51bWJlcjogJHt0eXBlb2YgZGVmYXVsdFZhbHVlfWAsXG4gICAgICApO1xuICB9XG5cbiAgbGV0IGZuO1xuICBpZiAodmFsaWRhdGUgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICBmbiA9IHZhbHVlID0+IHZhbGlkYXRlLnRlc3QodmFsdWUpIHx8IGVycm9yTWVzc2FnZTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsaWRhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGZuID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlKC4uLmFyZ3MpO1xuICAgICAgcmV0dXJuIHJlc3VsdCAhPT0gdHJ1ZSAmJiByZXN1bHQgIT09IHVuZGVmaW5lZFxuICAgICAgICA/IHJlc3VsdCB8fCBlcnJvck1lc3NhZ2VcbiAgICAgICAgOiByZXN1bHQ7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICBgVGhlIHNlY29uZCBhcmd1bWVudCBtdXN0IGJlIGEgUmVnRXhwIGluc3RhbmNlIG9yIGEgZnVuY3Rpb246ICR7dHlwZW9mIHZhbGlkYXRlfWAsXG4gICAgKTtcbiAgfVxuXG4gIHZhbGlkYXRpb25NYXAuc2V0KGRlZmF1bHRWYWx1ZSwgZm4pO1xuICByZXR1cm4gZGVmYXVsdFZhbHVlO1xufVxuXG5mdW5jdGlvbiBzdG9yZShNb2RlbCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGNvbmZpZyA9IGJvb3RzdHJhcChNb2RlbCk7XG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zICE9PSBcIm9iamVjdFwiKSB7XG4gICAgb3B0aW9ucyA9IHsgaWQ6IG9wdGlvbnMgfTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmlkICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMuaWQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIGNvbnN0IGlkID0gb3B0aW9ucy5pZDtcbiAgICBvcHRpb25zLmlkID0gaG9zdCA9PiBob3N0W2lkXTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmRyYWZ0KSB7XG4gICAgaWYgKGNvbmZpZy5saXN0KSB7XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAgIFwiRHJhZnQgbW9kZSBpcyBub3Qgc3VwcG9ydGVkIGZvciBsaXN0aW5nIG1vZGVsIGRlZmluaXRpb25cIixcbiAgICAgICk7XG4gICAgfVxuXG4gICAgTW9kZWwgPSB7XG4gICAgICAuLi5Nb2RlbCxcbiAgICAgIFtzdG9yZS5jb25uZWN0XToge1xuICAgICAgICBnZXQoaWQpIHtcbiAgICAgICAgICBjb25zdCBtb2RlbCA9IHN0b3JlLmdldChjb25maWcubW9kZWwsIGlkKTtcbiAgICAgICAgICByZXR1cm4gcmVhZHkobW9kZWwpID8gbW9kZWwgOiBwZW5kaW5nKG1vZGVsKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0KGlkLCB2YWx1ZXMpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWVzID09PSBudWxsID8geyBpZCB9IDogdmFsdWVzO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgb3B0aW9ucy5kcmFmdCA9IGJvb3RzdHJhcChNb2RlbCk7XG4gICAgZHJhZnRNYXAuc2V0KG9wdGlvbnMuZHJhZnQsIHsgbW9kZWw6IGNvbmZpZy5tb2RlbCwgaWQ6IG9wdGlvbnMuaWQgfSk7XG4gIH1cblxuICBjb25zdCBjcmVhdGVNb2RlID0gb3B0aW9ucy5kcmFmdCAmJiBjb25maWcuZW51bWVyYWJsZSAmJiAhb3B0aW9ucy5pZDtcblxuICBjb25zdCBkZXNjID0ge1xuICAgIGdldDogKGhvc3QsIGxhc3RWYWx1ZSkgPT4ge1xuICAgICAgaWYgKGNyZWF0ZU1vZGUgJiYgIWxhc3RWYWx1ZSkge1xuICAgICAgICBjb25zdCBuZXh0VmFsdWUgPSBvcHRpb25zLmRyYWZ0LmNyZWF0ZSh7fSk7XG4gICAgICAgIHN5bmMob3B0aW9ucy5kcmFmdCwgbmV4dFZhbHVlLmlkLCBuZXh0VmFsdWUpO1xuICAgICAgICByZXR1cm4gc3RvcmUuZ2V0KE1vZGVsLCBuZXh0VmFsdWUuaWQpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpZCA9XG4gICAgICAgIG9wdGlvbnMuZHJhZnQgJiYgbGFzdFZhbHVlXG4gICAgICAgICAgPyBsYXN0VmFsdWUuaWRcbiAgICAgICAgICA6IG9wdGlvbnMuaWQgJiYgb3B0aW9ucy5pZChob3N0KTtcblxuICAgICAgY29uc3QgbmV4dFZhbHVlID0gc3RvcmUuZ2V0KE1vZGVsLCBpZCk7XG5cbiAgICAgIGlmIChsYXN0VmFsdWUgJiYgbmV4dFZhbHVlICE9PSBsYXN0VmFsdWUgJiYgIXJlYWR5KG5leHRWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIG1hcFZhbHVlV2l0aFN0YXRlKGxhc3RWYWx1ZSwgbmV4dFZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5leHRWYWx1ZTtcbiAgICB9LFxuICAgIHNldDogY29uZmlnLmxpc3RcbiAgICAgID8gdW5kZWZpbmVkXG4gICAgICA6IChob3N0LCB2YWx1ZXMsIGxhc3RWYWx1ZSkgPT4ge1xuICAgICAgICAgIGlmICghbGFzdFZhbHVlIHx8ICFyZWFkeShsYXN0VmFsdWUpKSBsYXN0VmFsdWUgPSBkZXNjLmdldChob3N0KTtcblxuICAgICAgICAgIHN0b3JlXG4gICAgICAgICAgICAuc2V0KGxhc3RWYWx1ZSwgdmFsdWVzKVxuICAgICAgICAgICAgLmNhdGNoKC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovICgpID0+IHt9KTtcblxuICAgICAgICAgIHJldHVybiBsYXN0VmFsdWU7XG4gICAgICAgIH0sXG4gICAgY29ubmVjdDogb3B0aW9ucy5kcmFmdCA/ICgpID0+ICgpID0+IGNsZWFyKE1vZGVsLCBmYWxzZSkgOiB1bmRlZmluZWQsXG4gIH07XG5cbiAgcmV0dXJuIGRlc2M7XG59XG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oc3RvcmUsIHtcbiAgLy8gc3RvcmFnZVxuICBjb25uZWN0LFxuXG4gIC8vIGFjdGlvbnNcbiAgZ2V0LFxuICBzZXQsXG4gIGNsZWFyLFxuXG4gIC8vIGd1YXJkc1xuICBwZW5kaW5nLFxuICBlcnJvcixcbiAgcmVhZHksXG5cbiAgLy8gaGVscGVyc1xuICBzdWJtaXQsXG4gIHZhbHVlOiB2YWx1ZVdpdGhWYWxpZGF0aW9uLFxufSk7XG4iXX0=