degenerator
===========
### Turns sync functions into async generator functions
[![Build
Status](https://travis-ci.org/TooTallNate/node-degenerator.png?branch=master)](https://travis-ci.org/TooTallNate/node-degenerator)

Sometimes you need to write sync looking code that's really async under the hood.
This module takes a String to one or more synchronous JavaScript functions, and
returns a new String that with those JS functions transpiled into an ES6 Generator
Functions.

So this:

``` js
function foo () {
  return a('bar') || b();
}
```

Gets compiled into:

``` js
function* foo() {
    return (yield a('bar')) || (yield b());
}
```

From there, you can provide asynchronous thunk-based or Generator-based
implementations for the `a()` and `b()` functions, in conjunction with any
Generator-based flow control library to execute the contents of the
function asynchronously.


Installation
------------

Install with `npm`:

``` bash
$ npm install degenerator
```


Example
-------

You must explicitly specify the names of the functions that should be
"asyncified". So say we wanted to expose a `get(url)` function that did
and HTTP request and returned the response body.

The user has provided us with this implementation:

``` js
function () {
  var one = get('https://google.com');
  var two = get('http://nodejs.org');
  var three = JSON.parse(get('http://jsonip.org'));
  return [one, two, three];
}
```

Now we can compile this into an asyncronous generator function, implement the
async `get()` function, and finally evaluate it into a real JavaScript function
instance with the `vm` module:


``` js
var vm = require('vm');
var degenerate = require('degenerate');

// the `get()` function is thunk-based (error handling omitted for brevity)
function get (endpoint) {
  return function (fn) {
    var mod = 0 == endpoint.indexOf('https:') ? require('https') : require('http');
    var req = mod.get(endpoint);
    req.on('response', function (res) {
      var data = '';
      res.setEncoding('utf8');
      res.on('data', function (b) { data += b; });
      res.on('end', function () {
        fn(null, data);
      });
    });
  };
}

// convert the JavaScript string provided from the user (assumed to be `str` var)
str = degenerate(str, [ 'get' ]);

var fn = vm.runInNewContext('(' + str + ')', {
  get: get
});

console.log(fn);
```


API
---

### degenerator(String jsStr, Array functionNames) → String

Returns a "degeneratorified" JavaScript string, with ES6 Generator
functions transplanted.


License
-------

(The MIT License)

Copyright (c) 2013 Nathan Rajlich &lt;nathan@tootallnate.net&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
