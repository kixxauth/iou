exports.newDefer = function newDefer() {
    var self = {}
      , PENDING = 'pending'
      , KEPT = 'kept'
      , FAILED = 'failed'
      , status = PENDING
      , knownFate
      , keeperQueue = newQueue()
      , failureQueue = newQueue()

    function newQueue() {
        var q = []

        function queue(wrapped) {
            q.push(wrapped);
        }

        queue.commit = function (val) {
            enlighten(q, val);
        };

        return queue;
    }

    function enlighten(handlers, val) {
        var i = 0
          , len = handlers.length

        for (; i < len; i += 1) {
            handlers[i](val);
        }
    }

    function commit(state, val) {
        if (status !== PENDING) return;

        status = state;
        knownFate = val;

        if (status === KEPT) {
            keeperQueue.commit(val);
        } else {
            failureQueue.commit(val);
        }
    }

    function wrapHandler(handler, deferred) {
        function wrappedHandler(val) {
            process.nextTick(newWrapper(handler, deferred, val));
        }
        return wrappedHandler;
    }

    function newWrapper(handler, deferred, val) {
        function nextLayer() {
            try {
                var result = handler(val);
                if (result && result.isPromise === true) {
                    result.then(deferred.keep);
                    result.failure(deferred.fail);
                } else {
                    deferred.keep(result);
                }
            } catch (err) {
                deferred.fail(err);
            }
        }

        return nextLayer;
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
        then: function (next) {
            var deferred = newDefer()
              , wrapped = wrapHandler(next, deferred)

            if (status === PENDING) {
                keeperQueue(wrapped);
            } else if (status === KEPT) {
                wrapped(knownFate);
            }
            return deferred.promise;
        }

      , failure: function (handler) {
            var deferred = newDefer()
              , wrapped = wrapHandler(handler, deferred)

            if (status === PENDING) {
                failureQueue(wrapped);
            } else if (status === FAILED) {
                wrapped(knownFate);
            }
            return deferred.promise;
        }
    };

    return self;
}
