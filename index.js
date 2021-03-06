(function () {

if (typeof Promise !== 'function' || !(Promise.resolve && Promise.reject)) {

var FULFILLED = 'fulfilled'
, REJECTED = 'rejected'
, PENDING = 'pending'


function Promise(block) {
  ifInstanceOf(this, Promise, noop, function () {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")
  });

  ifFunction(block, noop, function () {
    throw new TypeError("You must pass a resolver function as the first argument to the promise constructor.");
  });

  var deferred = newDeferred(this);

  this.then = function (onFulfilled, onRejected) {
    var resolveNext
      , rejectNext

    var promise = new Promise(function (resolve, reject) {
      resolveNext = resolve;
      rejectNext = reject;
    });

    function addFulfillmentHandler() {
      return deferred.onFulfilled(wrapHandler(onFulfilled));
    }

    function proxyFulfillment() {
      return deferred.onFulfilled(resolveNext);
    }

    ifFunction(onFulfilled, addFulfillmentHandler, proxyFulfillment);

    function addRejectionHandler() {
      return deferred.onRejected(wrapHandler(onRejected));
    }

    function proxyRejection() {
      return deferred.onRejected(rejectNext);
    }

    ifFunction(onRejected, addRejectionHandler, proxyRejection);

    function wrapHandler(handler) {
      return tryCatch(handler, resolveNext, rejectNext);
    }

    return promise;
  };

  this.catch = function (onRejected) {
    return this.then(null, onRejected);
  };

  this._proxy = function (resolve, reject) {
    deferred.onFulfilled(resolve);
    deferred.onRejected(reject);
  };

  try {
    block(deferred.resolve, deferred.reject);
  } catch (err) {
    deferred.reject(err);
  }
}

Promise.cast = function (value) {
  if (value instanceof Promise) {
    return value;
  }
  return Promise.resolve(value);
};

Promise.resolve = function (value) {
  return new Promise(function (resolve, reject) {
    resolve(value);
  });
};

Promise.reject = function (error) {
  return new Promise(function (resolve, reject) {
    reject(error);
  });
};

Promise.all = function (promises) {
  if (!isArray(promises)) {
    promises = Array.prototype.slice.call(arguments);
  }

  var promise
    , values = []
    , count = 0
    , expected = promises.length

  promise = new Promise(function (resolve, reject) {
    var i = 0, len = promises.length

    function resolver(index) {
      return function (val) {
        values[index] = val;
        if ((count += 1) === expected) {
          resolve(values);
        }
      };
    }

    ifCondition(len === 0, function () {
      resolve(values);
    }, function () {
      for (; i < len; i += 1) {
        Promise.cast(promises[i])._proxy(resolver(i), reject);
      }
    });
  });

  return promise;
};

if (typeof window !== 'undefined') {
  window.Promise = Promise;
} else {
  exports.Promise = Promise;
}


function newDeferred(promise) {
  var self = Object.create(null)
    , status = PENDING
    , knownFate
    , fulfillmentHandlers = []
    , rejectionHandlers = []

  self.resolve = function (value) {
    var resolve = commit(fulfillmentHandlers, FULFILLED)
    resolveValue(value, promise, resolve, self.reject);
    return self;
  };
  self.resolve;

  self.reject = function (reason) {
    commit(rejectionHandlers, REJECTED)(reason);
    return self;
  };

  self.onFulfilled = addHandler(fulfillmentHandlers, FULFILLED);

  self.onRejected = addHandler(rejectionHandlers, REJECTED);

  function addHandler(handlers, expect) {
    return function (handler) {
      if (status === PENDING) {
        handlers.push(handler);
      } else if (status === expect) {
        queue(handler);
      }
    };
  }

  function queue(handler) {
    setTimeout(function () {
      handler(knownFate);
    }, 1);
  }

  function commit(handlers, committedStatus) {
    return function (fate) {
      setTimeout(function () {
        if (status !== PENDING) return;
        status = committedStatus;
        knownFate = fate;
        handlers.forEach(function (handler) {
          handler(knownFate);
        });
      }, 1);
    };
  }

  return self;
}


function resolveValue(x, promise, resolve, reject) {
  var invokeResolve = invoke(resolve, [x])

  function rejectWithSameObject() {
    return reject(new TypeError("promise === value"));
  }

  function checkIsPromise() {
    return ifInstanceOf(x, Promise, inheritState, checkIsThenable);
  }

  function inheritState() {
    x._proxy(resolve, reject);
  }

  function checkIsThenable() {
    return ifObjectOrFunction(x, dereferenceThenable, invokeResolve);
  }

  function dereferenceThenable() {
    return dereference(x, 'then', checkThenIsFunction, reject);
  }

  function checkThenIsFunction(then) {
    return ifFunction(then, invoke(resolveThenable, [then]), invokeResolve);
  }

  function resolveThenable(then) {
    var resolved = false

    try {
      then.call(x, function (y) {
        if (resolved) return;
        resolved = true;
        resolveValue(y, promise, resolve, reject);
      }, function (r) {
        if (resolved) return;
        resolved = true;
        reject(r);
      });
    } catch (err) {
      if (!resolved) reject(err);
    }
  }

  ifInstanceOf(x, Error, function () {
    return reject(x);
  }, function () {
    return ifSameObject(x, promise, rejectWithSameObject, checkIsPromise);
  });
}


function ifIsPromise(x, success, reject) {
  return ifInstanceOf(x, Promise, success, reject);
}

var isArray = (function () {
  var isArray

  if (typeof Array.isArray === 'function') {
    isArray = Array.isArray;
  } else {
    isArray = function (x) {
      return Object.prototype.toString.call(x) === '[object Array]';
    }
  }

  return isArray;
}());

function tryCatch(func, resolve, reject) {
  return function (val) {
    var x
    try {
      x = func(val);
    } catch (err) {
      reject(err);
      return;
    }
    resolve(x);
  }
}

function ifInstanceOf(x, y, success, reject) {
  return ifCondition(x instanceof y, success, reject);
}

function ifSameObject(x, y, success, reject) {
  return ifCondition(x === y, success, reject);
}

function ifFunction(x, success, reject) {
  return ifCondition(typeof x === 'function', success, reject);
}

function ifObjectOrFunction(x, success, reject) {
  var guard = (x && (typeof x === 'object' || typeof x === 'function'))
  return ifCondition(guard, success, reject);
}

function ifCondition(guard, success, reject) {
  if (guard) {
    return success();
  }
  return reject();
}

function dereference(x, name, success, reject) {
  var ref
  try {
    ref = x[name];
  } catch (err) {
    return reject(err);
  }
  return success(ref);
}

function invoke(func, args, context) {
  return function () {
    return func.apply(context || null, args);
  };
}

function noop() {}

}
}());
