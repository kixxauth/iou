exports.newDefer = function newDefer() {
    var self = {}
      , PENDING = 'pending'
      , KEPT = 'kept'
      , FAILED = 'failed'
      , status = PENDING
      , knownFate
      , keeperQueue = newQueue('keepers')
      , failureQueue = newQueue('failures')

    function newQueue(name) {
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
        then: function (next) {
            var deferred = newDefer()

            if (status === PENDING) {
                keeperQueue(function (val) {
                    process.nextTick(function () {
                        deferred.keep(next(val));
                    });
                });
                failureQueue(function (err) {
                    process.nextTick(function () {
                        deferred.fail(err);
                    });
                });
            } else if (status === KEPT) {
                process.nextTick(function () {
                    deferred.keep(next(knownFate));
                });
            } else {
                deferred.fail(knownFate);
            }

            return deferred.promise;
        }

      , failure: function (handler) {
            var deferred = newDefer()

            if (status === PENDING) {
                failureQueue(function (err) {
                    process.nextTick(function () {
                        deferred.keep(handler(err));
                    });
                });
                keeperQueue(function (val) {
                    process.nextTick(function () {
                        deferred.keep(val);
                    });
                });
            } else if (status === FAILED) {
                process.nextTick(function () {
                    deferred.keep(handler(knownFate));
                });
            } else {
                deferred.keep(knownFate);
            }

            return deferred.promise;
        }
    };

    return self;
}
