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

    if (typeof onFulfilled === 'function') {
      deferred.onFulfilled(wrapHandler(onFulfilled, resolveNext, rejectNext));
    } else {
      deferred.onFulfilled(wrapProxy(resolveNext));
    }
    if (typeof onRejected === 'function') {
      deferred.onRejected(wrapHandler(onRejected, resolveNext, rejectNext));
    } else {
      deferred.onRejected(wrapProxy(rejectNext));
    }

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

function newDefer(promise) {
  var self = Object.create(null)
    , status = PENDING
    , knownFate
    , fulfillmentHandlers = []
    , rejectionHandlers = []

  self.resolve = function deferred_resolve(value) {
    commitPromise(value, promise, function (value) {
      process.nextTick(function resolveNextTick() {
        if (status !== PENDING) return;
        status = FULFILLED;
        knownFate = value;
        fulfillmentHandlers.forEach(function (handler) {
          handler(status, knownFate);
        });
      });
    }, self.reject);
  };

  self.reject = function deferred_reject(error) {
    process.nextTick(function rejectNextTick() {
      if (status !== PENDING) return;
      status = REJECTED;
      knownFate = error;
      rejectionHandlers.forEach(function (handler) {
        handler(status, knownFate);
      });
    });
  };

  self.onFulfilled = function (handler) {
    if (status === PENDING) {
      fulfillmentHandlers.push(handler);
    } else if (status === FULFILLED) {
      process.nextTick(function () {
        handler(status, knownFate);
      });
    }
  };

  self.onRejected = function (handler) {
    if (status === PENDING) {
      rejectionHandlers.push(handler);
    } else if (status === REJECTED) {
      process.nextTick(function () {
        handler(status, knownFate);
      });
    }
  };

  return self;
}

exports.Promise = Promise;


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

function commitPromise(x, promise, resolve, reject) {
  if (x === promise) {
    reject(new TypeError("promise === x"));
    return;
  }
  if (x instanceof Promise) {
    x.then(resolve, reject);
    return;
  }
  if (x && (typeof x === 'object' || typeof x === 'function')) {
    var then, resolved = false

    try {
      then = x.then;
    } catch (err) {
      reject(err);
      return;
    }

    if (typeof then === 'function') {
      try {
        then.call(x, function resolvePromise(y) {
          if (resolved) return;
          resolved = true;
          commitPromise(y, promise, resolve, reject);
        }, function rejectPromise(r) {
          if (resolved) return;
          resolved = true;
          reject(r);
        });
      } catch (err) {
        if (!resolved) reject(err);
      }
      return;
    }
  }
  resolve(x);
}
