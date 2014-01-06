var IOU = require('../index')

var DUMMY = {dummy: true}
  , SENTINEL = {sentinel: true}
  , THENABLE = function (val) { return {then: function (resolved) { resolved(val); }}; }
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