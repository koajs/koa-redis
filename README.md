koa-redis [![Build Status](https://secure.travis-ci.org/koajs/koa-redis.svg)](http://travis-ci.org/koajs/koa-redis) [![Dependency Status](https://gemnasium.com/koajs/koa-redis.svg)](https://gemnasium.com/koajs/koa-redis)
=========

Redis storage for koa session middleware / cache.

[![NPM](https://nodei.co/npm/koa-redis.svg?downloads=true)](https://nodei.co/npm/koa-redis/)

## Usage

`koa-redis` works with [koa-sess](https://npmjs.org/package/koa-sess)(a session middleware for koa).

### Example

```javascript
var koa = require('koa');
var http = require('http');
var session = require('koa-sess');
var redisStore = require('koa-redis');

var app = koa();

app.name = 'koa-session-test';
app.keys = ['keys', 'keykeys'];

app.use(session({
  store: redisStore()
}));

app.use(function *() {
  this.session.name = 'koa-redis';
  this.body = this.session.name;
});

var app = module.exports = http.createServer(app.callback());
app.listen(8080);
```

### Options

```
 * {Object} client    redis client
 * {String} host      redis connect host (without options.client)
 * {Number} port      redis connect port (without options.client)
 * {String} socket    redis connect socket (without options.client)
 * {String} db        redis db
 * {String} pass      redis password
```

## Benchmark

|Server|Transaction rate|Response time|
|------|----------------|-------------|
|connect without session|**6763.56 trans/sec**|**0.01 secs**|
|koa without session|**5684.75 trans/sec**|**0.01 secs**|
|connect with session|**2759.70 trans/sec**|**0.02 secs**|
|koa with session|**2355.38 trans/sec**|**0.02 secs**|

Detail [benchmark report](https://github.com/dead-horse/koa-redis/tree/master/benchmark) here

## Authors

```
$ git summary

 project  : koa-redis
 repo age : 6 weeks ago
 commits  : 27
 active   : 9 days
 files    : 16
 authors  :
    20  dead_horse              74.1%
     3  Jesse Yang              11.1%
     3  sipajahava              11.1%
     1  Alessandro Lensi        3.7%
```

## Licences
(The MIT License)

Copyright (c) 2013 dead-horse and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
