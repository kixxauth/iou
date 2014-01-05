var IOU = require('../index')

var ERROR = new Error('TEST ERROR')

exports["Promise instance from Promise constructor"] = {
  setUp: function(done) {
    this.Promise = IOU.Promise
    this.promise = new IOU.Promise(function () {})
    return done();
  },

  "constructor throws if not called with `new`": function (test) {
    test.expect(1);
    try {
      this.Promise(function () {});
    } catch (err) {
      test.equal(err.message, "Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }
    return test.done();
  },

  "constructor throws if passed a non-function": function (test) {
    test.expect(1);
    try {
      new this.Promise();
    } catch (err) {
      test.equal(err.message, "You must pass a resolver function as the first argument to the promise constructor.");
    }
    return test.done();
  },

  "responds to instanceof": function (test) {
    test.ok(this.promise instanceof this.Promise);
    return test.done();
  },

  "constructor is Promise": function (test) {
    test.strictEqual(this.promise.constructor, this.Promise);
    return test.done();
  },

  "if an error is thrown in the code block passed to Promise, it rejects": function (test) {
    test.expect(1);

    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
      return;
    }

    function onFailure(err) {
      test.strictEqual(err, ERROR);
      test.done();
      return;
    }

    new this.Promise(function () {
      throw ERROR;
    }).then(onSuccess, onFailure);
  }

};