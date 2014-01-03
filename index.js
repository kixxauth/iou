var FULFILLED = 'fulfilled'
  , REJECTED = 'rejected'
  , PENDING = 'pending'


function Promise(block) {
  var deferred = newDefer(this)

  this.then = function (onFulfilled, onRejected) {
    var resolveNext, rejectNext

    var promise = new Promise(function (resolve, reject) {
      resolveNext = resolve;
      rejectNext = reject;
    });

    ifFunction(onFulfilled, function () {
      return deferred.onFulfilled(wrapHandler(onFulfilled, resolveNext, rejectNext));
    }, function () {
      return deferred.onFulfilled(wrapProxy(resolveNext));
    });

    ifFunction(onRejected, function () {
      return deferred.onRejected(wrapHandler(onRejected, resolveNext, rejectNext));
    }, function () {
      return deferred.onRejected(wrapProxy(rejectNext));
    })

    return promise;
  };

  block(deferred.resolve, deferred.reject);
}

Promise.resolve = function (value) {
  var promise = new Promise(function (resolve, reject) {
    resolve(value);
  });
  return promise;
};

Promise.reject = function (error) {
  var promise = new Promise(function (resolve, reject) {
    reject(error);
  });
  return promise;
};

exports.Promise = Promise;

function newDefer(promise) {
  var self = Object.create(null)
    , status = PENDING
    , knownFate
    , fulfillmentHandlers = []
    , rejectionHandlers = []

  self.resolve = function (value) {
    var resolve = commit(fulfillmentHandlers, FULFILLED)
    resolveValue(value, promise, resolve, self.reject);
  };

  self.reject = commit(rejectionHandlers, REJECTED);

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
      handler(status, knownFate);
    });
  }

  function commit(handlers, committedStatus) {
    return function (fate) {
      return process.nextTick(function () {
        if (status !== PENDING) return;
        status = committedStatus;
        knownFate = fate;
        handlers.forEach(function (handler) {
          handler(status, knownFate);
        });
      });
    };
  }

  return self;
}


function wrapHandler(handler, resolve, reject) {
  return function wrappedHandler(state, fate) {
    var x
    try {
      x = handler(fate);
    } catch (err) {
      reject(err);
      return;
    }
    resolve(x);
  }
}

function wrapProxy(next) {
  return function (state, fate) {
    next(fate);
  };
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
    return x.then(resolve, reject);
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

  return ifSameObject(x, promise, rejectWithSameObject, checkIsPromise);
}

function ifIsPromise(x, success, reject) {
  return ifInstanceOf(x, Promise, success, reject);
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
