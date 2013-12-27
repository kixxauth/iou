var FULFILLED = 'fulfilled'
  , REJECTED = 'rejected'
  , PENDING = 'pending'


function Promise(block) {
  var deferred = newDefer(this)

  this.then = function (onFulfilled, onRejected) {
    var promise = new Promise(function (resolve, reject) {
      if (typeof onFulfilled === 'function') {
        deferred.onFulfilled(wrapHandler(onFulfilled, promise, resolve, reject));
      } else {
        deferred.onFulfilled(wrapProxy(resolve));
      }
      if (typeof onRejected === 'function') {
        deferred.onRejected(wrapHandler(onRejected, promise, resolve, reject));
      } else {
        deferred.onRejected(wrapProxy(reject));
      }
    });

    return promise;
  };

  block(deferred.resolve, deferred.reject);
}

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

function newDefer(promise) {
  var self = Object.create(null)
    , status = PENDING
    , knownFate
    , fulfillmentHandlers = []
    , rejectionHandlers = []

  self.resolve = function (value) {
    process.nextTick(function () {
      if (status !== PENDING) return;
      status = FULFILLED;
      knownFate = value;
      fulfillmentHandlers.forEach(function (handler) {
        handler(status, knownFate);
      });
    });
  };

  self.reject = function (error) {
    process.nextTick(function () {
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
        handler(knownFate);
      });
    }
  };

  self.onRejected = function (handler) {
    if (status === PENDING) {
      rejectionHandlers.push(handler);
    } else if (status === REJECTED) {
      process.nextTick(function () {
        handler(knownFate);
      });
    }
  };

  return self;
}

exports.Promise = Promise;


function wrapHandler(handler, promise, resolve, reject) {
  return function (state, fate) {
    var x
    try {
      x = handler(fate);
    } catch (err) {
      reject(err);
      return;
    }
    commitPromise(promise, resolve, reject, x);
  }
}

function wrapProxy(next) {
  return function (state, fate) {
    next(fate);
  };
}

function commitPromise(promise, resolve, reject, x) {
  resolve(x);
}
