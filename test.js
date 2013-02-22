var ASSERT = require('assert')

  , IOU = require('./index')

  , FUNCT = 'function'

var tests = [];


tests.push(function (done) {
    "newDefer().promise is a promise object";

    var promise = IOU.newDefer().promise
      , promise2
      , promise3

    equal(type(promise.then), FUNCT, 'promise.then is a function');
    equal(type(promise.failure), FUNCT, 'promise.failure is a function');

    promise2 = promise.then();
    promise3 = promise.failure();

    equal(type(promise2.then), FUNCT, 'promise2.then is a function');
    equal(type(promise2.failure), FUNCT, 'promise2.failure is a function');
    equal(type(promise3.then), FUNCT, 'promise3.then is a function');
    equal(type(promise3.failure), FUNCT, 'promise3.failure is a function');
    return done();
});

tests.push(function (done) {
    "newDefer().keep() resolves once and only once";
    var counter = 0
      , d = IOU.newDefer()

    d.promise.then(function () {
        counter += 1;
        if (counter === 1) {
            return done();
        }
        wrapAssertion(function () {
            assert(false, 'promise.then called more than once');
        });
    });

    d.promise.failure(function () {
        wrapAssertion(function () {
            assert(false, 'promise.failure() should not be called');
        });
    });

    d.keep(1);
});

tests.push(function (done) {
    "newDefer().fail() resolves once and only once";
    var counter = 0
      , d = IOU.newDefer()

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

    d.fail(1);
});

tests.push(function (done) {
    ".then() handlers can be added after resolution.";
    var counter = 0
      , d = IOU.newDefer()

    d.keep(1);

    d.promise.then(function () {
        counter += 1;
        if (counter === 1) {
            return done();
        }
        wrapAssertion(function () {
            assert(false, 'promise.then called more than once');
        });
    });

    d.promise.failure(function () {
        wrapAssertion(function () {
            assert(false, 'promise.failure() should not be called');
        });
    });
});

tests.push(function (done) {
    ".failure() handlers can be added after resolution.";
    var counter = 0
      , d = IOU.newDefer()

    d.fail(1);

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
            assert(exec, 'promise.then() called in stack');
            return done();
        });
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
            assert(exec, 'promise.failure() called in stack');
            return done();
        });
    });

    exec = true;
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

function assert(val, msg) {
    msg = 'assert '+ val +'; '+ msg;
    return ASSERT.ok(val, msg);
}

function equal(actual, expected, msg) {
    msg = actual +' != '+ expected +'; '+ msg;
    return ASSERT.equal(actual, expected, msg);
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
asyncStack(tests)();
