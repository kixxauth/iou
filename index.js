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

  this.deferred = newDeferred(this);
  this.isPromise = true;

  this.then = function (onFulfilled, onRejected) {
    var self = this
      , resolveNext
      , rejectNext

    var promise = new Promise(function (resolve, reject) {
      resolveNext = resolve;
      rejectNext = reject;
    });

    ifFunction(onFulfilled, function () {
      return self.deferred.onFulfilled(wrapHandler(onFulfilled));
    }, function () {
      return self.deferred.onFulfilled(resolveNext);
    });

    ifFunction(onRejected, function () {
      return self.deferred.onRejected(wrapHandler(onRejected));
    }, function () {
      return self.deferred.onRejected(rejectNext);
    })

    function wrapHandler(handler) {
      return tryCatch(handler, resolveNext, rejectNext);
    }

    return promise;
  };

  this.fail = function (onRejected) {
    return this.then(null, onRejected);
  };

  this.failure = this.fail;

  Object.freeze(this);

  try {
    block(this.deferred.resolve, this.deferred.reject);
  } catch (err) {
    this.deferred.reject(err);
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
  if (!Array.isArray(promises)) {
    promises = Array.prototype.slice.call(arguments);
  }

  var deferred = exports.newDefer()
    , values = []
    , count = 0
    , expected = promises.length

  promises.forEach(function (promise, index) {
    promise.then(function (val) {
      values[index] = val;
      if ((count += 1) === expected) {
        deferred.keep(values);
      }
    }, deferred.fail);
  });

  return deferred.promise
};

exports.Promise = Promise;


exports.newDefer = function () {
  var keep, fail
  var promise = new Promise(function (resolve, reject) {
    fail = reject;
    keep = resolve;
  });

  promise.deferred.keep = keep;
  promise.deferred.fail = fail;
  return promise.deferred;
};

exports.waitFor = Promise.all;


function newDeferred(promise) {
  var self = Object.create(null)
    , status = PENDING
    , knownFate
    , fulfillmentHandlers = []
    , rejectionHandlers = []

  self.promise = promise;

  self.resolve = function (value) {
    var resolve = commit(fulfillmentHandlers, FULFILLED)
    resolveValue(value, promise, resolve, self.reject);
    return self;
  };
  self.keep = self.resolve;

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
    process.nextTick(function () {
      handler(knownFate);
    });
  }

  function commit(handlers, committedStatus) {
    return function (fate) {
      return process.nextTick(function () {
        if (status !== PENDING) return;
        status = committedStatus;
        knownFate = fate;
        handlers.forEach(function (handler) {
          handler(knownFate);
        });
      });
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
    x.deferred.onFulfilled(resolve);
    x.deferred.onRejected(reject);
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
