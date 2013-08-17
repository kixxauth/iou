var IOU = require('../index')

exports["newDefer().promise is a promise object"] = function (test) {
  var promise = IOU.newDefer().promise
    , promise2
    , promise3

  // Check duck typing for the returned promise.
  test.ok(Object.isFrozen(promise), 'promise is frozen');
  test.strictEqual(promise.isPromise, true, 'promise.isPromise');
  test.ok(isFunction(promise.then), 'promise.then is a function');
  test.ok(isFunction(promise.failure), 'promise.failure is a function');

  // Calls to then() and failure() each produce a new promise.
  promise2 = promise.then();
  promise3 = promise.failure();
  test.notStrictEqual(promise, promise2, 'promise !== promise2');
  test.notEqual(promise2, promise3, 'promise2 !== promise3');

  test.ok(Object.isFrozen(promise2), 'promise2 is frozen');
  test.strictEqual(promise2.isPromise, true, 'promise2.isPromise');
  test.ok(isFunction(promise2.then), 'promise2.then is a function');
  test.ok(isFunction(promise2.failure), 'promise2.failure is a function');

  test.ok(Object.isFrozen(promise3), 'promise3 is frozen');
  test.strictEqual(promise3.isPromise, true, 'promise3.isPromise');
  test.ok(isFunction(promise3.then), 'promise3.then is a function');
  test.ok(isFunction(promise3.failure), 'promise3.failure is a function');
  return test.done();
};

exports["newDefer().keep() resolves once and only once"] = function (test) {
  test.expect(1);

  var counter = 0
    , d = IOU.newDefer()

  // The .then() handler should be the only one that resolves, and is only
  // resolved once.
  d.promise.then(function () {
    wrapAssertion(function () {
      test.ok(true, 'promise.then should be called once')
    });

    counter += 1;
    if (counter === 1) {
        return test.done();
    }

    wrapAssertion(function () {
        test.ok(false, 'promise.then called more than once');
    });
  });

  // Since the deferred.keep() call is made first, the .failure() handler should
  // never be invoked.
  d.promise.failure(function () {
    wrapAssertion(function () {
      test.ok(false, 'promise.failure() should not be called');
    });
  });

  // Try to resolve promise multiple times.
  d.keep();
  d.keep();
  d.fail();
};

exports["newDefer().fail() resolves once and only once"] = function (test) {
  test.expect(1);

  var counter = 0
    , d = IOU.newDefer()

  // The .failure() handler should be the only one that resolves, and is only
  // resolved once.
  d.promise.failure(function () {
    test.ok(true, "promise.then() should be called once.")
    counter += 1;
    if (counter === 1) {
        return test.done();
    }
    wrapAssertion(function () {
        test.ok(false, '.failure() handler called more than once');
    });
  });

  // Since the deferred.fail() call is made first, the .then() handler should
  // never be invoked.
  d.promise.then(function () {
      wrapAssertion(function () {
          test.ok(false, '.then() handler should not be called');
      });
  });

  // Try to resolve promise multiple times.
  d.fail();
  d.fail();
  d.keep();
};

exports[".then() handlers can be added after resolution."] = function (test) {
  test.expect(1);

  var counter = 0
    , d = IOU.newDefer()

  // The promise is resolved here, but ...
  d.keep(1);

  // The handlers are not set until we get to here. And, everything still
  // works.

  d.promise.then(function () {
    test.ok(true, "promise.then is called once")

    counter += 1;
    if (counter === 1) {
      return test.done();
    }
    wrapAssertion(function () {
      test.ok(false, 'promise.then() handler called more than once');
    });
  });

  d.promise.failure(function () {
    wrapAssertion(function () {
      test.ok(false, 'promise.failure() handler should not be called');
    });
  });
};

exports[".failure() handlers can be added after resolution."] = function (test) {
  test.expect(1);

  var counter = 0
    , d = IOU.newDefer()

  // The promise is resolved here, but ...
  d.fail(1);

  // The handlers are not set until we get to here. And, everything still
  // works.

  d.promise.failure(function () {
    test.ok(true, "promise.failure is called once")
    counter += 1;
    if (counter === 1) {
      return test.done();
    }
    wrapAssertion(function () {
      test.ok(false, 'promise.failure() called more than once');
    });
  });

  d.promise.then(function () {
    wrapAssertion(function () {
      test.ok(false, 'promise.then() should not be called');
    });
  });
};

exports["newDefer().then() executed in next tick of event loop"] = function (test) {
  test.expect(1);

  var exec = false
    , d = IOU.newDefer()

  d.keep(1);

  d.promise.then(function () {
    wrapAssertion(function () {
      // If this were not executed in the next turn of the event loop,
      // then exec would be false.
      test.ok(exec, 'promise.then() called in stack');
    });
    return test.done();
  });

  exec = true;
};

exports["newDefer().failure() executed in next tick of event loop"] = function (test) {
  test.expect(1);

  var exec = false
    , d = IOU.newDefer()

  d.fail(1);

  d.promise.failure(function () {
    wrapAssertion(function () {
      // If this were not executed in the next turn of the event loop,
      // then exec would be false.
      test.ok(exec, 'promise.failure() called in stack');
    });
    return test.done();
  });

  exec = true;
};

exports["then() handlers can be chained and will be executed in order."] = function (test) {
  test.expect(6);

  var d = IOU.newDefer()
    , counter = 0

  function f1(v) {
    counter += 1;
    wrapAssertion(function () {
      test.equal(v, 1, 'f1');
      test.equal(counter, 1, 'f1 counter should be 1');
    });

    return v + 1;
  }

  function f2(v) {
    counter += 1;
    wrapAssertion(function () {
      test.equal(v, 2, 'f2');
      // f4 will be called before f2, because f4 is on the same layer as
      // f1, which is the first layer.
      test.equal(counter, 2, 'f2 counter should be 3');
    });

    return v + 1;
  }

  function f3(v) {
    counter += 1;
    wrapAssertion(function () {
      // f4 is set as a handler on the first promise. In other words, it
      // is on the same layer as f1, which means it will get the same
      // value as f1; starting a new chain.
      test.equal(v, 3, 'f4');
      test.equal(counter, 3, 'f4 counter should be 2');
    });

    test.done();
  }

  d.promise.then(f1).then(f2).then(f3);
  d.keep(1);
};

exports["A failure is automagically recovered by a failure handler."] = function (test) {
  test.expect(2);

  var d = IOU.newDefer()
    , err = new Error('handle me')
    , val = {}

  d.fail(err);

  // The first then() handler will never be called. It is skipped, while the
  // first failure() handler is called instead.
  function neverCalled() {
    wrapAssertion(function () {
      test.ok(false, 'neverCalled should not be called.');
    });
  }

  // The failure() handler can return a value other than an error to recover.
  function handleError(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err, 'e is err');
    });
    return val;
  }

  // The next then() handler will get the value passed from the failure()
  // handler.
  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  d.promise.then(neverCalled).failure(handleError).then(continueOn);
};

exports["A failure() handler is skipped if there is no failure"] = function (test) {
  test.expect(1);

  var d = IOU.newDefer()
    , err = new Error('handle me')
    , val = {}

  d.keep(val);

  // The first failure() handler will never be called. It is skipped, while the
  // first then() handler is called instead.
  function neverCalled() {
    wrapAssertion(function () {
      test.ok(false, 'neverCalled should not be called.');
    });
  }

  // The next then() handler will get the resolved value.
  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  d.promise.failure(neverCalled).then(continueOn);
};

exports["A failure is automagically recovered by a failure handler (next tick)."] = function (test) {
  test.expect(2);

  var d = IOU.newDefer()
    , err = new Error('handle me')
    , val = {}


  process.nextTick(function () {
      d.fail(err);
  });

  // The first then() handler will never be called. It is skipped, while the
  // first failure() handler is called instead.
  function neverCalled() {
    wrapAssertion(function () {
      test.ok(false, 'neverCalled should not be called.');
    });
  }

  // The failure() handler can return a value other than an error to recover.
  function handleError(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err, 'e is err');
    });
    return val;
  }

  // The next then() handler will get the value passed from the failure()
  // handler.
  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  d.promise.then(neverCalled).failure(handleError).then(continueOn);
};

exports["A failure() handler is skipped if there is no failure (next tick)"] = function (test) {
  test.expect(1);

  var d = IOU.newDefer()
    , err = new Error('handle me')
    , val = {}

  process.nextTick(function () {
    d.keep(val);
  });

  // The first failure() handler will never be called. It is skipped, while the
  // first then() handler is called instead.
  function neverCalled() {
    wrapAssertion(function () {
      test.ok(false, 'neverCalled should not be called.');
    });
  }

  // The next then() handler will get the resolved value.
  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  d.promise.failure(neverCalled).then(continueOn);
};

exports["Handlers can return a promise for a value. (async)"] = function (test) {
  test.expect(2);

  var d = IOU.newDefer()
    , err = new Error('some err')
    , val = {}

  process.nextTick(function () {
    d.keep(1);
  });

  function returnPromise() {
    // Return a promise which has already been resolved.
    return IOU.newDefer().fail(err).promise;
  }

  function handleFailure(e) {
    wrapAssertion(function () {
      // Proxied promises are resolved by the time they are passed to the
      // handlers.
      test.strictEqual(e, err, 'e is err');
    });
    // Return another promise which has already been resolved.
    return IOU.newDefer().keep(val).promise;
  }

  function continueOn(v) {
    wrapAssertion(function () {
      // Proxied promises are resolved by the time they are passed to the
      // handlers.
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  d.promise.then(returnPromise).failure(handleFailure).then(continueOn);
};

exports["Handlers can throw and catch errors. (async)"] = function (test) {
  test.expect(3);

  var d = IOU.newDefer()
    , val = {}
    , err1 = new Error('err 2')
    , err2 = new Error('err 3')

  process.nextTick(function () {
    d.keep(1);
  });

  function throw1() {
    throw err1;
  }

  // .failure() handler
  function catch1(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err1, 'e is err1');
    });
    throw err2;
  }

  // .failure() handler
  function catch2(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err2, 'e is err2');
    });
    // Recover from the error.
    return val;
  }

  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  function neverCall(name) {
    return function () {
      wrapAssertion(function () {
        test.ok(false, name +' should not be called.');
      });
    };
  }

  // .then() handlers are not called when a promise layer has failed.
  d.promise
      .then(throw1)
      .failure(catch1)
      .then(neverCall('second'))
      .failure(catch2)
      .failure(neverCall('third'))
      .then(continueOn);

  d.promise.failure(neverCall('first'))
};

exports["Handlers can throw and catch errors (sync)."] = function (test) {
  test.expect(3);

  var d = IOU.newDefer()
    , val = {}
    , err1 = new Error('err 2')
    , err2 = new Error('err 3')

  d.keep(1);

  function throw1() {
    throw err1;
  }

  // .failure() handler
  function catch1(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err1, 'e is err1');
    });
    throw err2;
  }

  // .failure() handler
  function catch2(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err2, 'e is err2');
    });
    // Recover from the error.
    return val;
  }

  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  function neverCall(name) {
    return function () {
      wrapAssertion(function () {
        test.ok(false, name +' should not be called.');
      });
    };
  }

  // .then() handlers are not called when a promise layer has failed.
  d.promise
    .then(throw1)
    .failure(catch1)
    .then(neverCall('second'))
    .failure(catch2)
    .failure(neverCall('third'))
    .then(continueOn);

  d.promise.failure(neverCall('first'))
};

exports["Handlers can return and catch errors. (async)"] = function (test) {
  test.expect(3);

  var d = IOU.newDefer()
    , val = {}
    , err1 = new Error('err 1')
    , err2 = new Error('err 2')

  process.nextTick(function () {
    d.keep(1);
  });

  function return1() {
    // Return an Error object.
    return err1;
  }

  // .failure() handler
  function catch1(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err1, 'e is err1');
    });
    return err2;
  }

  // .failure() handler
  function catch2(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err2, 'e is err2');
    });
    // Recover from the error.
    return val;
  }

  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  function neverCall(name) {
    return function () {
      wrapAssertion(function () {
        test.ok(false, name +' should not be called.');
      });
    };
  }

  // .then() handlers are not called when a promise layer has failed.
  d.promise
    .then(return1)
    .failure(catch1)
    .then(neverCall('second'))
    .failure(catch2)
    .failure(neverCall('third'))
    .then(continueOn);

  d.promise.failure(neverCall('first'))
};

exports["Handlers can return and catch errors (sync)."] = function (test) {
  test.expect(3);

  var d = IOU.newDefer()
    , val = {}
    , err1 = new Error('err 2')
    , err2 = new Error('err 3')

  d.keep(1);

  function return1() {
    // Return an Error object.
    return err1;
  }

  // .failure() handler
  function catch1(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err1, 'e is err1');
    });
    return err2;
  }

  // .failure() handler
  function catch2(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err2, 'e is err2');
    });
    // Recover from the error.
    return val;
  }

  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  function neverCall(name) {
    return function () {
      wrapAssertion(function () {
        test.ok(false, name +' should not be called.');
      });
    };
  }

  // .then() handlers are not called when a promise layer has failed.
  d.promise
      .then(return1)
      .failure(catch1)
      .then(neverCall('second'))
      .failure(catch2)
      .failure(neverCall('third'))
      .then(continueOn);

  d.promise.failure(neverCall('first'))
};

exports["Handlers can return and catch promises for errors. (async)"] = function (test) {
  test.expect(3);

  var d = IOU.newDefer()
    , val = {}
    , err1 = new Error('err 2')
    , err2 = new Error('err 3')

  process.nextTick(function () {
    d.keep(1);
  });

  function return1() {
    // Return a failed promise.
    return IOU.newDefer().fail(err1).promise;
  }

  // .failure() handler
  function catch1(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err1, 'e is err1');
    });
    return IOU.newDefer().fail(err2).promise;
  }

  // .failure() handler
  function catch2(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err2, 'e is err2');
    });
    // Recover from the error.
    return val;
  }

  function continueOn(v) {
    wrapAssertion(function () {
      test.strictEqual(v, val, 'v is val');
    });
    return test.done();
  }

  function neverCall(name) {
      return function () {
          wrapAssertion(function () {
              test.ok(false, name +' should not be called.');
          });
      };
  }

  // .then() handlers are not called when a promise layer has failed.
  d.promise
      .then(return1)
      .failure(catch1)
      .then(neverCall('second'))
      .failure(catch2)
      .failure(neverCall('third'))
      .then(continueOn);

  d.promise.failure(neverCall('first'))
};

exports["Handlers can return and catch promises for errors (sync)."] = function (test) {
  test.expect(3);

  var d = IOU.newDefer()
    , val = {}
    , err1 = new Error('err 2')
    , err2 = new Error('err 3')

  d.keep(1);

  function return1() {
    // Return a failed promise.
    return IOU.newDefer().fail(err1).promise;
  }

  // .failure() handler
  function catch1(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err1, 'e is err1');
    });
    return IOU.newDefer().fail(err2).promise;
  }

  // .failure() handler
  function catch2(e) {
    wrapAssertion(function () {
      test.strictEqual(e, err2, 'e is err2');
    });
    // Recover from the error.
    return val;
  }

  function continueOn(v) {
      wrapAssertion(function () {
          test.strictEqual(v, val, 'v is val');
      });
      return test.done();
  }

  function neverCall(name) {
      return function () {
          wrapAssertion(function () {
              assert(false, name +' should not be called.');
          });
      };
  }

  // .then() handlers are not called when a promise layer has failed.
  d.promise
      .then(return1)
      .failure(catch1)
      .then(neverCall('second'))
      .failure(catch2)
      .failure(neverCall('third'))
      .then(continueOn);

  d.promise.failure(neverCall('first'))
};


function isFunction(x) {
  return typeof x === 'function' ? true : false;
}

function wrapAssertion(block) {
    try {
        block();
    } catch (err) {
        console.log(err.stack || err.toString());
        process.exit(1);
    }
}
