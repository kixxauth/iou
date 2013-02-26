var ASSERT = require('assert')

  , IOU = require('./index')

  , FUNCT = 'function'

var tests = [];


tests.push(function (done) {
    "newDefer().promise is a promise object";

    var promise = IOU.newDefer().promise
      , promise2
      , promise3

    // Check duck typing for the returned promise.
    assert(Object.isFrozen(promise), 'promise is frozen');
    equal(promise.isPromise, true, 'promise.isPromise');
    equal(type(promise.then), FUNCT, 'promise.then is a function');
    equal(type(promise.failure), FUNCT, 'promise.failure is a function');

    // Calls to then() and failure() each produce a new promise.
    promise2 = promise.then();
    promise3 = promise.failure();
    notEqual(promise, promise2, 'promise !== promise2');
    notEqual(promise2, promise3, 'promise2 !== promise3');

    assert(Object.isFrozen(promise2), 'promise2 is frozen');
    equal(promise2.isPromise, true, 'promise2.isPromise');
    equal(type(promise2.then), FUNCT, 'promise2.then is a function');
    equal(type(promise2.failure), FUNCT, 'promise2.failure is a function');

    assert(Object.isFrozen(promise3), 'promise3 is frozen');
    equal(promise3.isPromise, true, 'promise3.isPromise');
    equal(type(promise3.then), FUNCT, 'promise3.then is a function');
    equal(type(promise3.failure), FUNCT, 'promise3.failure is a function');
    return done();
});

tests.push(function (done) {
    "newDefer().keep() resolves once and only once";

    var counter = 0
      , d = IOU.newDefer()

    // The .then() handler should be the only one that resolves, and is only
    // resolved once.
    d.promise.then(function () {
        counter += 1;
        if (counter === 1) {
            return done();
        }
        wrapAssertion(function () {
            assert(false, 'promise.then called more than once');
        });
    });

    // Since the deferred.keep() call is made first, the .failure() handler should
    // never be invoked.
    d.promise.failure(function () {
        wrapAssertion(function () {
            assert(false, 'promise.failure() should not be called');
        });
    });

    // Try to resolve promise multiple times.
    d.keep();
    d.keep();
    d.fail();
});

tests.push(function (done) {
    "newDefer().fail() resolves once and only once";

    var counter = 0
      , d = IOU.newDefer()

    // The .failure() handler should be the only one that resolves, and is only
    // resolved once.
    d.promise.failure(function () {
        counter += 1;
        if (counter === 1) {
            return done();
        }
        wrapAssertion(function () {
            assert(false, '.failure() handler called more than once');
        });
    });

    // Since the deferred.fail() call is made first, the .then() handler should
    // never be invoked.
    d.promise.then(function () {
        wrapAssertion(function () {
            assert(false, '.then() handler should not be called');
        });
    });

    // Try to resolve promise multiple times.
    d.fail();
    d.fail();
    d.keep();
});

tests.push(function (done) {
    ".then() handlers can be added after resolution.";

    var counter = 0
      , d = IOU.newDefer()

    // The promise is resolved here, but ...
    d.keep(1);

    // The handlers are not set until we get to here. And, everything still
    // works.

    d.promise.then(function () {
        counter += 1;
        if (counter === 1) {
            return done();
        }
        wrapAssertion(function () {
            assert(false, 'promise.then() handler called more than once');
        });
    });

    d.promise.failure(function () {
        wrapAssertion(function () {
            assert(false, 'promise.failure() handler should not be called');
        });
    });
});

tests.push(function (done) {
    ".failure() handlers can be added after resolution.";

    var counter = 0
      , d = IOU.newDefer()

    // The promise is resolved here, but ...
    d.fail(1);

    // The handlers are not set until we get to here. And, everything still
    // works.

    d.promise.failure(function () {
        counter += 1;
        if (counter === 1) {
            return done();
        }
        wrapAssertion(function () {
            assert(false, 'promise.failure() called more than once');
        });
    });

    d.promise.then(function () {
        wrapAssertion(function () {
            assert(false, 'promise.then() should not be called');
        });
    });
});

tests.push(function (done) {
    "newDefer().then() executed in next tick of event loop";

    var exec = false
      , d = IOU.newDefer()

    d.keep(1);

    d.promise.then(function () {
        wrapAssertion(function () {
            // If this were not executed in the next turn of the event loop,
            // then exec would be false.
            assert(exec, 'promise.then() called in stack');
        });
        return done();
    });

    exec = true;
});

tests.push(function (done) {
    "newDefer().failure() executed in next tick of event loop";

    var exec = false
      , d = IOU.newDefer()

    d.fail(1);

    d.promise.failure(function () {
        wrapAssertion(function () {
            // If this were not executed in the next turn of the event loop,
            // then exec would be false.
            assert(exec, 'promise.failure() called in stack');
        });
        return done();
    });

    exec = true;
});

tests.push(function (done) {
    "then() handlers can be chained and will be executed in order.";

    var d = IOU.newDefer()
      , counter = 0

    function f1(v) {
        counter += 1;
        wrapAssertion(function () {
            equal(v, 1, 'f1');
            equal(counter, 1, 'f1 counter should be 1');
        });

        return v + 1;
    }

    function f2(v) {
        counter += 1;
        wrapAssertion(function () {
            equal(v, 2, 'f2');
            // f4 will be called before f2, because f4 is on the same layer as
            // f1, which is the first layer.
            equal(counter, 3, 'f2 counter should be 3');
        });

        return v + 1;
    }

    function f3(v) {
        counter += 1;
        wrapAssertion(function () {
            equal(v, 3, 'f3');
            equal(counter, 4, 'f3 counter should be 4');
        });

        return v + 1;
    }

    function f4(v) {
        counter += 1;
        wrapAssertion(function () {
            // f4 is set as a handler on the first promise. In other words, it
            // is on the same layer as f1, which means it will get the same
            // value as f1; starting a new chain.
            equal(v, 1, 'f4');
            equal(counter, 2, 'f4 counter should be 2');
        });

        return done();
    }

    d.promise.then(f1).then(f2).then(f3);
    d.promise.then(f4);

    d.keep(1);
});

tests.push(function (done) {
    "A failure is automagically recovered by a failure handler.";

    var d = IOU.newDefer()
      , err = new Error('handle me')
      , val = {}

    d.fail(err);

    // The first then() handler will never be called. It is skipped, while the
    // first failure() handler is called instead.
    function neverCalled() {
        wrapAssertion(function () {
            assert(false, 'neverCalled should not be called.');
        });
    }

    // The failure() handler can return a value other than an error to recover.
    function handleError(e) {
        wrapAssertion(function () {
            equal(e, err, 'e is err');
        });
        return val;
    }

    // The next then() handler will get the value passed from the failure()
    // handler.
    function continueOn(v) {
        wrapAssertion(function () {
            equal(v, val, 'v is val');
        });
        return done();
    }

    d.promise.then(neverCalled).failure(handleError).then(continueOn);
});

tests.push(function (done) {
    "A failure() handler is skipped if there is no failure";

    var d = IOU.newDefer()
      , err = new Error('handle me')
      , val = {}

    d.keep(val);

    // The first failure() handler will never be called. It is skipped, while the
    // first then() handler is called instead.
    function neverCalled() {
        wrapAssertion(function () {
            assert(false, 'neverCalled should not be called.');
        });
    }

    // The next then() handler will get the resolved value.
    function continueOn(v) {
        wrapAssertion(function () {
            equal(v, val, 'v is val');
        });
        return done();
    }

    d.promise.failure(neverCalled).then(continueOn);
});

tests.push(function (done) {
    "A failure is automagically recovered by a failure handler (next tick).";

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
            assert(false, 'neverCalled should not be called.');
        });
    }

    // The failure() handler can return a value other than an error to recover.
    function handleError(e) {
        wrapAssertion(function () {
            equal(e, err, 'e is err');
        });
        return val;
    }

    // The next then() handler will get the value passed from the failure()
    // handler.
    function continueOn(v) {
        wrapAssertion(function () {
            equal(v, val, 'v is val');
        });
        return done();
    }

    d.promise.then(neverCalled).failure(handleError).then(continueOn);
});

tests.push(function (done) {
    "A failure() handler is skipped if there is no failure (next tick)";

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
            assert(false, 'neverCalled should not be called.');
        });
    }

    // The next then() handler will get the resolved value.
    function continueOn(v) {
        wrapAssertion(function () {
            equal(v, val, 'v is val');
        });
        return done();
    }

    d.promise.failure(neverCalled).then(continueOn);
});

tests.push(function (done) {
    "A then() handler can return a promise for a value.";

    var d = IOU.newDefer()
      , err = new Error('some err')
      , val = {}

    function returnPromise() {
        return IOU.newDefer().fail(err).promise;
    }

    function handleFailure(e) {
        wrapAssertion(function () {
            equal(e, err, 'e is err');
        });
        return IOU.newDefer().keep(val).promise;
    }

    function continueOn(v) {
        wrapAssertion(function () {
            equal(v, val, 'v is val');
        });
        return done();
    }

    d.promise.then(returnPromise).failure(handleFailure).then(continueOn);
    d.keep(1);
});

// End of testing.
tests.push(function () { console.log('PASSED'); });


// Helpers

function type(obj) {
    return typeof obj;
}

function wrapAssertion(block) {
    try {
        block();
    } catch (err) {
        console.log(err.stack || err.toString());
        process.exit(1);
    }
}

// Test vocabulary

function assert(val, msg) {
    msg = 'assert '+ val +'; '+ msg;
    return ASSERT.ok(val, msg);
}

function equal(actual, expected, msg) {
    msg = actual +' !== '+ expected +'; '+ msg;
    return ASSERT.strictEqual(actual, expected, msg);
}

function notEqual(actual, expected, msg) {
    msg = actual +' == '+ expected +'; '+ msg;
    return ASSERT.notEqual(actual, expected, msg);
}

// Compose test functions using continuation passing.
function asyncStack(functions) {
    var callback = functions.pop()
      , last = callback

    functions.reverse().forEach(function (fn) {
        var child = callback;
        callback = function () {
            fn(child);
        };
    });
    return callback;
}

// Run tests.
if (module === require.main) {
    asyncStack(tests)();
}
