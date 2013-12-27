var IOU = require('../index')


exports.resolved = IOU.Promise.resolve;

exports.rejected = IOU.Promise.reject;

exports.deferred = function () {
  var deferred = {}
  deferred.promise = new IOU.Promise(function (resolve, reject) {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
};
