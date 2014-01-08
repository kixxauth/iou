IOU
===

A JavaScript library to shim Node.js with the upcoming JavaScript Promise API.
There are a lot of libraries that do this already:

* [Q](https://github.com/kriskowal/q)
* [RSVP.js](https://github.com/tildeio/rsvp.js)
* [Promised-IO](https://github.com/kriszyp/promised-io)
* [Promise](https://github.com/then/promise)
* [micro-promise](https://github.com/Gozala/micro-promise)

but they all do a lot of other stuff too, which you may or may not want, and
not all of them fully implement the new Promise object that will be available
soon. IOU is designed to simply bring promises to Node.js in as small a package
as possible.  There are no bells and whistles, no dependencies, just a simple
API that should allow you to transition to the native Promise API as soon as it
arrives in Node land.

## Installation
The most common use of IOU is to use it as a library. In that case, just
include it in your Node.js project by adding a line for IOU in your
`pacakge.json`. For more information about your `package.json` file, you should
check out the npm documentation by running `npm help json`.

Alternatively, you can quickly install IOU for use in a project by running

	npm install iou

which will install iou in your `node_modules/` folder.

## Examples

You can create a new promise with the constructor, passing it a block of code
in the form of a callback function. Inside that block of code is where the
asynchronous call is made, and the promise is resolved or rejected:

```JavaScript
var FS = require('fs')
  , IOU = require('iou')

var readmePromise = new IOU.Promise(function (resolve, reject) {
  FS.readFile('README.md', {encoding: 'utf8'}, function (err, text) {
    if (err) return reject(err);
    return resolve(text);
  });
})
```

Once you have a promise, you can add handlers:
```JavaScript
function printText(text) {
  console.log(text);
}

// The text String you passed into resolve() will get passed to printText().
readmePromise.then(printText);
```

Add an error handler too:
```JavaScript
// Create an error handling function.
function die(err) {
  console.error(err.stack);
  process.exit(1);
}

// The text String you passed into resolve() will get passed to printText(),
// and the Error you passed into reject() will get passed to die().
readmePromise.then(printText, die);

// We can improve this even more. By passing console.log as the success
// handler, we don't even need our printText() function.
readmePromise.then(console.log, die);
```

Promises become super powerful in JavaScript when we need to compose a series
of actions into a process where some of those actions involve asynchronous
operations.

```JavaScript
function printWordCount(path) {
  // Notice how obvious it is to understand what is happening here. Each of
  // these functions will be called in the order given, but only after each
  // previous one completes any asynchronous operations.
  readFile(path)
    .then(joinLines)
    .then(splitWords)
    .then(countWords)
    .then(console.log)
    .catch(die)

  // If any errors are thrown in any of the functions in the chain, or if any
  // of them rejects a promise, `catch(die)` will catch and handle them.
}

function readFile(path) {
  var promise = new IOU.Promise(function (resolve, reject) {
    FS.readFile(path, {encoding: 'utf8'}, function (err, text) {
      if (err) return reject(err);
      return resolve(text);
    });
  })
}

function joinLines(text) {
  return text.split('\n').join(' ');
}

function splitWords(text) {
  return text.split(' ');
}

function countWords(words) {
  return words.length;
}

function die(err) {
  console.error(err.stack);
  process.exit(1);
}
```

## API Quick Reference

### Module import
Import IOU using require like this:
```JavaScript
var IOU = require('iou')
```

### Promise Constructor
Construct a Promise instance by passing in a block of code in the form of a
callback function. Your callback function will be passed a resolve function
and reject function as arguments. Use `resolve(value)` to resolve your promise
to a given value, or use `reject(err)` to reject it with an Error.
```JavaScript
// Assuming you've already imported IOU like above:

var FS = require('fs')

var promise = new IOU.Promise(function (resolve, reject) {
  FS.readFile('README.md', {encoding: 'utf8'}, function (err, text) {
    if (err) return reject(err);
    return resolve(text);
  });
})
```

### #then()
Once you have a Promise instance, you can attach resolve and reject listeners
with `then(onResolve, onReject)`. The first parameter `onResolve(value)` will
be passed the resolved value of the promise if it succeeds. The second
parameter `onReject(err)` will be passed the rejected Error of the promise if
it ends up getting rejected.

If you only care about rejections, you can pass `null` in place of
`onResolve()`, and if you want to skip handling rejections then don't pass in
the `onReject()` handler at all.

The `then()` method returns the promise, so you can chain it to compose a
sequence of actions, which is really powerful.
```JavaScript
  // Assuming we're using the promise we created above:

  // Listen for both the resolved value, or rejected error:
  promise.then(console.log, console.error);

  // Listen for resolved values only:
  promise.then(console.log);

  // Listen for the rejected error only:
  promise.then(null, console.error);

  // Chain calls to `then()` like in the example code earlier:
  readFile(path)
    .then(joinLines, console.error)
    .then(splitWords, console.error)
    .then(countWords, console.error)
    .then(console.log, console.error)
```

### #catch()
This is really just an alias for `then(null, onReject)`. This is a pattern that
is good to use, since it catches any possible thrown errors or rejected promises
that have not been handled in the chain.
```JavaScript
	// Simple use:
  promise.then(console.log).catch(console.error);

	// A global error handler.
  function die(err) {
    console.error(err.stack);
    process.exit(1);
  }

  // console.log() and console.error() should never throw, but if we pretend
  // that they would, then using catch() would handle thrown errors or
  // rejections from either of them.
  promise.then(console.log, console.error).catch(die);

  // catch() becomes much more useful in chaining, where errors or rejections
  // can bubble up the chain and eventually all be caught by the handler given
  // to catch() (aptly named). A good example comes from the example code from
  // earlier:
  readFile(path)
    .then(joinLines)
    .then(splitWords)
    .then(countWords)
    .then(console.log)
    .catch(die)
```

### Promise.resolve()
Sometimes you need to simply pass back a promise from a normal synchronous
function instead of a value.  That's what the `Promise.resolve()` class method
allows you to do.
```JavaScript
// This function does not perform any asynchronous operations, but could be
// used in a promise.then() chain if we return a promise instance.
function getDaysInYear() {
  return IOU.Promise.resolve(365);
}

getDaysInYear().then(otherThing).catch(errorHandler);
```

### Promise.reject()
Other times you need to turn an error into a rejection. That's what the
`Promise.reject()` class method is used for. This is particularly useful in a
resolved handler, where the rejection will get passed to the next rejection
handler.
```JavaScript
function catchEmptyFile(text) {
  if (!text) {
    var err = new Error("Empty file");

    // Use Promise.reject() to pass an error through the promise chain. If you
    // didn't do this, then the next success handler would be called instead of
    // the error handler.

    return IOU.Promise.reject(err);
  }
  return text;
}

function die(err) {
  console.error(err.stack);
  process.exit(1);
}

// Using Promise.reject() in catchEmptyFile() will cause an empty file error
// to be caught by catch(die), and console.log will never be called.

promise.then(catchEmptyFile).then(console.log).catch(die);
```

### Promise.all()
The `Promise.all()` class method collects an array of promises and returns a
new promise that will only be resolved if all of the promises resolve. If any
one of them rejects, then the new promise returned by Promise.all() will reject
with the first rejection.

Normal non-Promise values can also be passed in the array to `Promise.all()`
and they will be casted to a Promise instance.
```JavaScript
function printAll(texts) {
  console.log.call(console, texts);
}

var promises = [readFile('./config.yaml'), "host: localhost", readFile('/home/kris/config.yaml')]
IOU.Promise.all(promises).then(printAll).catch(die);
```

## Testing
To run the tests, just do

	./manage test

A list of checkmarks followed by `OK` means the tests succeeded. Anything else
should print out a stack trace for you, indicating a test failure.

Copyright and License
---------------------
Copyright (c) 2013 by Kris Walker <kris@kixx.name> (http://www.kixx.name).

Unless otherwise indicated, all source code is licensed under the MIT license.
See LICENSE for details.
