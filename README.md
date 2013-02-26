IOU
===

A simple JavaScript library which forces asynchronous code to give you a
promise for a value; at the very least. Really, that's not asking too much is
it?

## Installation
The most common use of IOU is to use it as a library. In that case, just
include it in your Node.js project by adding a line for IOU in your
`pacakge.json`. For more information about your `package.json` file, you should
check out the npm documentation by running `npm help json`.

Alternatively, you can quickly install IOU for use in a project by running

	npm install iou

which will install iou in your `node_modules/` folder.

## Testing
To run the tests, just do

	node test.js

You should see 'PASSED' as the only output. Any failed tests will output an
error message and halt execution. If you don't see anything, that means the
tests did not complete for some reason. You'll have to set breakpoints to
figure out where.

Copyright and License
---------------------
Copyright (c) 2013 by Kris Walker <kris@kixx.name> (http://www.kixx.name).

Unless otherwise indicated, all source code is licensed under the MIT license.
See LICENSE for details.
