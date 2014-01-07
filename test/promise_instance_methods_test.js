var IOU = require('../index')


var DUMMY = {dummy: true}
  , SENTINEL = {sentinel: true}
  , ERROR = new Error('TEST ERROR')


exports[".catch()"] = {
  setUp: function(done) {
    this.Promise = IOU.Promise;
    this.promise = this.Promise.reject(ERROR);
    return done();
  },

  "returns a Promise instance": function (test) {
    var promise = this.promise.catch();
    test.ok(promise instanceof this.Promise, "promise instanceof this.Promise");
    return test.done();
  },

  "returns a *new* Promise": function (test) {
    var promise = this.promise.catch();

    test.ok(promise !== this.promise, "promise !== this.promise");
    return test.done();
  },

  "catches a rejection": function (test) {
    this.promise.catch(function (err) {
      test.strictEqual(err, ERROR);
      test.done();
    });
  },

  "catches an ignored rejection": function (test) {
    function onSuccess() {
      test.ok(false, 'onSuccess() should not be called');
      test.done();
    }

    this.promise.then(onSuccess).catch(function (err) {
      test.strictEqual(err, ERROR);
      test.done();
    });
  },

  "catches thrown errors from previous layer": function (test) {
    function onSuccess() {
      throw ERROR;
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }

    this.Promise.resolve(DUMMY).then(onSuccess, onFailure).catch(function (err) {
      test.strictEqual(err, ERROR);
      test.done();
    });
  },

  "return value from .catch() handler will be cast into promise chain": function (test) {
    test.expect(2);

    function catchError(err) {
      test.strictEqual(err, ERROR);
      return SENTINEL;
    }

    function onSuccess(val) {
      test.strictEqual(val, SENTINEL);
      test.done();
    }

    function onFailure() {
      test.ok(false, 'onFailure() should not be called');
      test.done();
    }

    this.promise.catch(catchError).then(onSuccess, onFailure);
  }
};
