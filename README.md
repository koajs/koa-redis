koa-redis [![Build Status](https://secure.travis-ci.org/dead-horse/koa-redis.png)](http://travis-ci.org/dead-horse/koa-redis) [![Coverage Status](https://coveralls.io/repos/dead-horse/koa-redis/badge.png)](https://coveralls.io/r/dead-horse/koa-redis) [![Dependency Status](https://gemnasium.com/dead-horse/koa-redis.png)](https://gemnasium.com/dead-horse/koa-redis)
=========

koa session with redis

[![NPM](https://nodei.co/npm/koa-redis.png?downloads=true)](https://nodei.co/npm/koa-redis/)

## Usage  

`koa-redis` work with [koa-sess](https://npmjs.org/package/koa-sess)(a session middleware for koa).

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
 * {String} prefix    session prefix
 * {String} pass      redis password
 * {Object} client    redis client
 * {String} host      redis connect host (with out options.client)
 * {Number} port      redis connect port (with out options.client)
 * {String} socket    redis connect socket (with out options.client)
 * {String} db        redis db
 * {Number} ttl       redis ttl, defaulting to session.cookie.maxAge or oneDay
```

## Licences
(The MIT License)

Copyright (c) 2013 dead-horse and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
