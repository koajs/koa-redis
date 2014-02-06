koa-redis [![Build Status](https://secure.travis-ci.org/dead-horse/koa-redis.png)](http://travis-ci.org/dead-horse/koa-redis) [![Coverage Status](https://coveralls.io/repos/dead-horse/koa-redis/badge.png)](https://coveralls.io/r/dead-horse/koa-redis) [![Dependency Status](https://gemnasium.com/dead-horse/koa-redis.png)](https://gemnasium.com/dead-horse/koa-redis)
=========

Redis storage for koa session middleware / cache.

[![NPM](https://nodei.co/npm/koa-redis.png?downloads=true)](https://nodei.co/npm/koa-redis/)

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
 * {String} prefix    session prefix, defaulting to `koa:sass:`
 * {String} pass      redis password
 * {Object} client    redis client
 * {String} host      redis connect host (without options.client)
 * {Number} port      redis connect port (without options.client)
 * {String} socket    redis connect socket (without options.client)
 * {String} db        redis db
 * {Number} ttl       redis ttl(seconds), defaulting to session.cookie.maxAge / 1000 or oneDay
                      when set to null, will disable expires
```

## Benchmark  

|Server|Transaction rate|Response time|
|------|----------------|-------------|
|connect without session|**6763.56 trans/sec**|**0.01 secs**|
|koa without session|**5684.75 trans/sec**|**0.01 secs**|
|connect with session|**2759.70 trans/sec**|**0.02 secs**|
|koa with session|**2355.38 trans/sec**|**0.02 secs**|

Detail [benchmark report](https://github.com/dead-horse/koa-redis/tree/master/benchmark) here

## Licences
(The MIT License)

Copyright (c) 2013 dead-horse and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
