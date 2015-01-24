var IOU = require('../index')


var DUMMY = {dummy: true}
  , SENTINEL = {sentinel: true}
  , THENABLE = function (val) { return {then: function (resolved) { resolved(val); }}; }
  , REJECTED_THENABLE = function (err) { return {then: function (r, rejected) { rejected(err); }}; }
  , ERROR = new Error('TEST ERROR')


exports["Promise.resolve()"] = {
  setUp: function(done) {
    this.Promise = IOU.Promise;
    this.resolve = this.Promise.resolve;
    return done();
  },

  "creates a Promise instance from plain object": function (test) {
    var promise = this.resolve(DUMMY)
    test.ok(promise instanceof this.Promise, "promise instanceof this.Promise");
    return test.done();
  },

  "creates a *new* Promise from an existing Promise": function (test) {
    var promise = new this.Promise(function (resolve) {
      resolve(DUMMY);
    });
      
    var newPromise = this.resolve(promise)

    test.ok(newPromise !== promise, "newPromise !== promise");
    return test.done();
  },

  "creates a Promise for SENTINEL that resolves to SENTINEL": function (test) {
    test.expect(1);

    function onSuccess(val) {
      test.strictEqual(val, SENTINEL);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }
      
    this.resolve(SENTINEL).then(onSuccess, onFailure);
  },

  "creates a Promise for THENABLE which resolves to THENABLE fulfillment value": function (test) {
    test.expect(1);

    function onSuccess(val) {
      test.strictEqual(val, SENTINEL);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }
      
    this.resolve(THENABLE(SENTINEL)).then(onSuccess, onFailure);
  },

  "creates a Promise for `undefined` when no arguments": function (test) {
    test.expect(1);

    function onSuccess(val) {
      test.strictEqual(val, undefined);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }
      
    this.resolve().then(onSuccess, onFailure);
  }
};


exports["Promise.reject()"] = {
  setUp: function(done) {
    this.Promise = IOU.Promise;
    this.reject = this.Promise.reject;
    return done();
  },

  "creates a Promise instance from plain Error": function (test) {
    var promise = this.reject(ERROR)
    test.ok(promise instanceof this.Promise, "promise instanceof this.Promise");
    return test.done();
  },

  "creates a *new* Promise from an existing Promise": function (test) {
    var promise = new this.Promise(function (resolve, reject) {
      reject(ERROR);
    });
      
    var newPromise = this.reject(promise)

    test.ok(newPromise !== promise, "newPromise !== promise");
    return test.done();
  },

  "creates a Promise for ERROR that rejects to ERROR": function (test) {
    test.expect(1);

    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
    }

    function onFailure(val) {
      test.strictEqual(val, ERROR);
      test.done();
    }
      
    this.reject(ERROR).then(onSuccess, onFailure);
  },

  "creates a Promise for THENABLE which rejects to THENABLE": function (test) {
    test.expect(1);
    var thenable = THENABLE(DUMMY);

    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
    }

    function onFailure(reason) {
      test.strictEqual(reason, thenable);
      test.done();
    }
      
    this.reject(thenable).then(onSuccess, onFailure);
  },

  "creates a Promise for rejection reason `undefined` when no arguments": function (test) {
    test.expect(1);

    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
    }

    function onFailure(reason) {
      test.strictEqual(reason, undefined);
      test.done();
    }
      
    this.reject().then(onSuccess, onFailure);
  }
};


exports["Promise.cast()"] = {
  setUp: function(done) {
    this.Promise = IOU.Promise;
    this.cast = this.Promise.cast;
    return done();
  },

  "return a promise from a plain object": function (test) {
    var promise = this.cast(DUMMY);
    test.ok(promise instanceof this.Promise, "promise instanceof Promise");
    return test.done();
  },

  "simply returns a Promise instance": function (test) {
    var promise1, promise2
    promise1 = new this.Promise(function (resolve) { resolve(DUMMY); });
    promise2 = this.cast(promise1);
    test.strictEqual(promise1, promise2);
    return test.done();
  },

  "creates a Promise for SENTINEL that resolves to SENTINEL": function (test) {
    test.expect(1);

    function onSuccess(val) {
      test.strictEqual(val, SENTINEL);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }
      
    this.cast(SENTINEL).then(onSuccess, onFailure);
  },

  "creates a Promise for THENABLE which resolves to THENABLE fulfillment value": function (test) {
    test.expect(1);

    function onSuccess(val) {
      test.strictEqual(val, SENTINEL);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }
      
    this.cast(THENABLE(SENTINEL)).then(onSuccess, onFailure);
  },

  "creates a Promise for `undefined` when no arguments": function (test) {
    test.expect(1);

    function onSuccess(val) {
      test.strictEqual(val, undefined);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }
      
    this.cast().then(onSuccess, onFailure);
  }
};


exports["Promise.all()"] = {
  setUp: function(done) {
    this.Promise = IOU.Promise;
    this.all = this.Promise.all;
    return done();
  },

  "returns a Promise instance": function (test) {
    var promise = this.all();
    test.ok(promise instanceof this.Promise, "promise instanceof Promise");
    return test.done();
  },

  "returns a Promise that resovles from an Array of promises": function (test) {
    var p1 = this.Promise.resolve(1)
      , p2 = this.Promise.resolve(2)
      , p3 = this.Promise.resolve(3)

    function onSuccess(values) {
      test.strictEqual(values[0], 1);
      test.strictEqual(values[1], 2);
      test.strictEqual(values[2], 3);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }

    this.all([p1, p2, p3]).then(onSuccess, onFailure);
  },

  "input values may include non-promise values": function (test) {
    var p1 = this.Promise.resolve(1)
      , p2 = SENTINEL
      , p3 = this.Promise.resolve(3)

    function onSuccess(values) {
      test.strictEqual(values[0], 1);
      test.strictEqual(values[1], SENTINEL);
      test.strictEqual(values[2], 3);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }

    this.all([p1, p2, p3]).then(onSuccess, onFailure);
  },

  "input values may include thenables, which are resolved": function (test) {
    var p1 = this.Promise.resolve(1)
      , p2 = THENABLE(SENTINEL)
      , p3 = this.Promise.resolve(3)

    function onSuccess(values) {
      test.strictEqual(values[0], 1);
      test.strictEqual(values[1], SENTINEL);
      test.strictEqual(values[2], 3);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }

    this.all([p1, p2, p3]).then(onSuccess, onFailure);
  },

  "input order is preserved in the return Array": function (test) {
    var p1, p2, p3

    p1 = new this.Promise(function (resolve) {
      setTimeout(function () { resolve(1) }, 30)
    });

    p2 = new this.Promise(function (resolve) {
      setTimeout(function () { resolve(2) }, 20)
    });

    p3 = new this.Promise(function (resolve) {
      setTimeout(function () { resolve(3) }, 10)
    });

    function onSuccess(values) {
      test.strictEqual(values[0], 1);
      test.strictEqual(values[1], 2);
      test.strictEqual(values[2], 3);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }

    this.all([p1, p2, p3]).then(onSuccess, onFailure);
  },

  "returned Promise rejects if any input Promise rejects": function (test) {
    var p1 = this.Promise.resolve(1)
      , p2 = this.Promise.reject(ERROR)
      , p3 = this.Promise.resolve(3)

    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
    }

    function onFailure(err) {
      test.strictEqual(err, ERROR);
      test.done();
    }

    this.all([p1, p2, p3]).then(onSuccess, onFailure);
  },

  "returned Promise rejects if any input thenable rejects": function (test) {
    var p1 = this.Promise.resolve(1)
      , p2 = REJECTED_THENABLE(ERROR)
      , p3 = this.Promise.resolve(3)

    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
    }

    function onFailure(err) {
      test.strictEqual(err, ERROR);
      test.done();
    }

    this.all([p1, p2, p3]).then(onSuccess, onFailure);
  },

  "rejects if an input rejects at any point on the event loop": function (test) {
    var p1, p2, p3

    p1 = new this.Promise(function (resolve) {
      setTimeout(function () { resolve(1) }, 10)
    });

    p2 = new this.Promise(function (r, reject) {
      setTimeout(function () { reject(ERROR) }, 20)
    });

    p3 = new this.Promise(function (resolve) {
      setTimeout(function () { resolve(3) }, 1)
    });

    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
    }

    function onFailure(err) {
      test.strictEqual(err, ERROR);
      test.done();
    }

    this.all([p1, p2, p3]).then(onSuccess, onFailure);
  },

  "only the first rejection is considered": function (test) {
    var p1, p2, p3

    p1 = new this.Promise(function (resolve) {
      setTimeout(function () { resolve(1) }, 10)
    });

    p2 = new this.Promise(function (r, reject) {
      setTimeout(function () { reject(new Error("not considered")) }, 20)
    });

    p3 = new this.Promise(function (r, reject) {
      setTimeout(function () { reject(ERROR) }, 1)
    });

    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
    }

    function onFailure(err) {
      test.strictEqual(err, ERROR);
      test.done();
    }

    this.all([p1, p2, p3]).then(onSuccess, onFailure);
  },

  "resolves an empty Array as an empty Array": function (test) {
    var toString = Object.prototype.toString;
    this.all([]).then(function (result) {
      test.ok(toString.call(result) === '[object Array]', "Result is an Array");
      test.equal(result.length, 0, "Result is empty");
      test.done();
    });
  }

};
