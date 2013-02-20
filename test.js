var ASSERT = require('assert')

  , IOU = require('./index')

  , FUNCT = 'function'

var tests = [];


tests.push(function () {
    "newDefer().promise is a promise object";

    var promise = IOU.newDefer().promise;

    equal(type(promise.then), FUNCT, 'promise.then is a function');
    equal(type(promise.failure), FUNCT, 'promise.failure is a function');
});


function type(obj) {
    return typeof obj;
}

function equal(actual, expected, msg) {
    msg = actual +' != '+ expected +'; '+ msg;
    return ASSERT.equal(actual, expected, msg);
}

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

asyncStack(tests)();
