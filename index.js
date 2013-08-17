exports.newDefer = function newDefer() {
  var self = {}

    // Possible states:
    , PENDING = 'pending'
    , KEPT = 'kept'
    , FAILED = 'failed'

    // Current state:
    , status = PENDING

    // The resolved value (assigned as soon as we know what it will be).
    , knownFate

    // Handler queues for keeper handlers and failure handlers.
    , keeperQueue = newQueue('keepers')
    , failureQueue = newQueue('failures')


  // Helper function: Resolves this deferred such that it cannot be resolved
  // again, and notifies all the handlers.
  function commit(state, val) {
    if (status !== PENDING) return;

    status = state; // Update the state for this deferred.
    knownFate = val; // Set the value for the knownFate of this deferred.

    // Notify the relevant handler queue.
    if (status === KEPT) {
      keeperQueue.commit(knownFate);
    } else {
      failureQueue.commit(knownFate);
    }
  }

  self.keep = function (val) {
    commit(KEPT, val);
    return this;
  };

  self.fail = function (err) {
    commit(FAILED, err);
    return this;
  };

  self.promise = {
    isPromise: true

    , then: function (next, handler) {
        var deferred = newDefer()

        switch (status) {

        case PENDING:
          keeperQueue(wrapHandler(deferred, next));

          if (handler) {
            failureQueue(wrapHandler(deferred, handler));
          }

          // Add a dummy failure handler to the failureQueue for this
          // promise layer; proxying it to the next layer.
          failureQueue(function (err) {
            process.nextTick(function () {
              deferred.fail(err);
            });
          });
          break;

        case KEPT:
          // Create and immediately call the wrapped success handler.
          wrapHandler(deferred, next)(knownFate);
          break;

        case FAILED:
          if (handler) {
            // Create and immediately call the wrapped handler.
            wrapHandler(deferred, handler)(knownFate);

          } else {
            // If the deferred has already been resolved, then proxy it to
            // the next layer.
            deferred.fail(knownFate);
          }
          break;
        }

        return deferred.promise;
      }

    , failure: function (handler) {
        var deferred = newDefer()

        switch (status) {

        case PENDING:
          failureQueue(wrapHandler(deferred, handler));

          // Add a dummy keeper handler to the keeperQueue for this
          // promise layer; proxying it to the next layer.
          keeperQueue(function (val) {
            process.nextTick(function () {
              deferred.keep(val);
            });
          });
          break;

        case FAILED:
          // Create and immediately call the wrapped handler.
          wrapHandler(deferred, handler)(knownFate);
          break;

        case KEPT:
          // If the deferred has already been resolved, then proxy it to
          // the next layer.
          deferred.keep(knownFate);
          break;
        }

        return deferred.promise;
      }
  };

  // Freeze the promise so that it can be passed around to other code, and
  // also to protect the .isPromise flag.
  Object.freeze(self.promise);
  return self;
}


// Create a new function queue. This returns a function, which accepts a
// function as the only parameter, adding it to the queue. The returned
// function object also has a .commit() method which will execute all functions
// in the queue with the given value.
function newQueue(name) {
  var q = []

  function queue(func) {
    q.push(func);
  }

  queue.commit = function (val) {
    callFunctionsWith(q, val);
  };

  return queue;
}


// Execute an array of functions with the given value.
function callFunctionsWith(funcs, val) {
  var i = 0
    , len = funcs.length

  for (; i < len; i += 1) {
    funcs[i](val);
  }
}


// Wrap a handler passed to promise.then() or promise.failure(). Returns a
// handler function which accepts a single parameter (the 'value') and is
// suitable for passing into a newQueue.
function wrapHandler(deferred, handler) {
  function wrappedHandler(val) {

    // Promise handlers must execute on the next tick of the event loop.
    process.nextTick(function () {
      try {
        var rv = handler(val);
      } catch (e) {
        // If the handler throws, the next promise.failure() handler
        // must be called.
        deferred.fail(e);
        return;
      }

      if (rv && rv instanceof Error) {
        // If the handler returns an error, the next promise.failure()
        // handler must be called.
        deferred.fail(rv);

      } else if (rv && rv.isPromise) {
        // If the handler returns a promise, then proxy it.
        rv.then(deferred.keep);
        rv.failure(deferred.fail);

      } else {
        // Otherwise pass along the resolved value to the next
        // promise.then() handler.
        deferred.keep(rv);
      }
    });
  }

  return wrappedHandler;
}
