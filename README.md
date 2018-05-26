# koa-redis

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]
[![David deps][david-image]][david-url]
[![David devDeps][david-dev-image]][david-dev-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]
[![license][license-image]][license-url]

[npm-image]: https://img.shields.io/npm/v/koa-redis.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-redis
[travis-image]: https://img.shields.io/travis/koajs/koa-redis.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/koa-redis
[coveralls-image]: https://img.shields.io/coveralls/koajs/koa-redis.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/koajs/koa-redis?branch=master
[david-image]: https://img.shields.io/david/koajs/koa-redis.svg?style=flat-square&label=deps
[david-url]: https://david-dm.org/koajs/koa-redis
[david-dev-image]: https://img.shields.io/david/dev/koajs/koa-redis.svg?style=flat-square&label=devDeps
[david-dev-url]: https://david-dm.org/koajs/koa-redis#info=devDependencies
[david-opt-image]: https://img.shields.io/david/optional/koajs/koa-redis.svg?style=flat-square&label=optDeps
[david-opt-url]: https://david-dm.org/koajs/koa-redis#info=devDependencies
[node-image]: https://img.shields.io/node/v/koa-redis.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/koa-redis.svg?style=flat-square
[download-url]: https://npmjs.org/package/koa-redis
[gittip-image]: https://img.shields.io/gittip/dead-horse.svg?style=flat-square
[gittip-url]: https://www.gittip.com/dead-horse/
[license-image]: https://img.shields.io/npm/l/koa-redis.svg?style=flat-square
[license-url]: https://github.com/koajs/koa-redis/blob/master/LICENSE

Redis storage for koa session middleware/cache.

[![NPM](https://nodei.co/npm/koa-redis.svg?downloads=true)](https://nodei.co/npm/koa-redis/)

## Usage

`koa-redis` works with [koa-session](https://github.com/koajs/session) (a generic session middleware for koa).

### Example

```js
const session = require('koa-session');
const redisStore = require('koa-redis');
const koa = require('koa');

const app = koa();
app.keys = ['keys', 'keykeys'];
app.use(session({
  store: redisStore({
    // Options specified here
  })
}));

app.use(function *() {
  switch (this.path) {
  case '/get':
    get.call(this);
    break;
  case '/remove':
    remove.call(this);
    break;
  case '/regenerate':
    yield regenerate.call(this);
    break;
  }
});

function get() {
  const session = this.session;
  session.count = session.count || 0;
  session.count++;
  this.body = session.count;
}

function remove() {
  this.session = null;
  this.body = 0;
}

function *regenerate() {
  get.call(this);
  yield this.regenerateSession();
  get.call(this);
}

app.listen(8080);
```

### Options

- *all [`node_redis`](https://www.npmjs.com/package/redis#options-is-an-object-with-the-following-possible-properties) options* - Useful things include `url`, `host`, `port`, and `path` to the server. Defaults to `127.0.0.1:6379`
- `db` (number) - will run `client.select(db)` after connection
- `client` (object) - supply your own client, all other options are ignored unless `duplicate` is also supplied
- `duplicate` (boolean) - When true, it will run `client.duplicate(options)` on the supplied `client` and use all other options supplied. This is useful if you want to select a different DB for sessions but also want to base from the same client object.
- `serialize` - Used to serialize the data that is saved into the store.
- `unserialize` - Used to unserialize the data that is fetched from the store.
- **DEPRECATED:** old options - `pass` and `socket` have been replaced by `auth_pass` and `path`, but they should be backward compatible (still work).

## Events

See the [`node_redis` docs](https://www.npmjs.com/package/redis#connection-events) for more info.

- `ready`
- `connect`
- `reconnecting`
- `error`
- `end`
- `warning`

## API

These are some the functions that `koa-session` uses that you can use manually. You will need to initialize differently than the example above:

```js
const session = require('koa-session');
const redisStore = require('koa-redis')({
  // Options specified here
});
const app = require('koa')();

app.keys = ['keys', 'keykeys'];
app.use(session({
  store: redisStore
}));
```

### module([options])

Initialize the Redis connection with the optionally provided options (see above). *The variable `session` below references this*.

#### session.get(sid)

Generator that gets a session by ID. Returns parsed JSON is exists, `null` if it does not exist, and nothing upon error.

### session.set(sid, sess, ttl)

Generator that sets a JSON session by ID with an optional time-to-live (ttl) in milliseconds. Yields `node_redis`'s `client.set()` or `client.setex()`.

### session.destroy(sid)

Generator that destroys a session (removes it from Redis) by ID. Yields `node_redis`'s `client.del()`.

### session.quit()

Generator that stops a Redis session after everything in the queue has completed. Yields `node_redis`'s `client.quit()`.

#### session.end()

Alias to `session.quit()`. It is not safe to use the real end function, as it cuts off the queue.

### session.connected

Boolean giving the connection status updated using `client.connected` after any of the events above is fired.

### session.\_redisClient

Direct access to the `node_redis` client object.

### session.client

Direct access to the `co-redis` wrapper around the `node_redis` client.

## Benchmark

|Server|Transaction rate|Response time|
|------|----------------|-------------|
|connect without session|**6763.56 trans/sec**|**0.01 secs**|
|koa without session|**5684.75 trans/sec**|**0.01 secs**|
|connect with session|**2759.70 trans/sec**|**0.02 secs**|
|koa with session|**2355.38 trans/sec**|**0.02 secs**|

Detailed benchmark report [here](https://github.com/koajs/koa-redis/tree/master/benchmark)

## Testing

1. Start a Redis server on `localhost:6379`. You can use [`redis-windows`](https://github.com/ServiceStack/redis-windows) if you are on Windows or just want a quick VM-based server. Alternatively, if you have both [Docker](https://docs.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed, you can run `docker-compose up` to run the Redis server as a docker container.
1. Clone the repository and run `npm i` in it (Windows should work fine).
1. If you want to see debug output, turn on the prompts' `DEBUG` flag.
1. Run `npm test` to run the tests and generate coverage. To run the tests without generating coverage, run `npm run-script test-only`.

## Authors

See the [contributing tab](https://github.com/koajs/koa-redis/graphs/contributors)

## License

This library is distributed under the terms of the [MIT License](License).
