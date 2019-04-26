# koa-redis

[![build status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]
[![David deps][david-image]][david-url]
[![David devDeps][david-dev-image]][david-dev-url]
[![license][license-image]][license-url]
[![code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg?style=flat-square)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![made with lass](https://img.shields.io/badge/made_with-lass-95CC28.svg?style=flat-square)](https://lass.js.org)

> Redis storage for Koa session middleware/cache with Sentinel and Cluster support

[![NPM](https://nodei.co/npm/koa-redis.svg?downloads=true)](https://nodei.co/npm/koa-redis/)

**v4.0.0+ now uses `ioredis` and has support for Sentinel and Cluster!**


## Table of Contents

* [Install](#install)
* [Usage](#usage)
  * [Basic](#basic)
  * [Sentinel](#sentinel)
  * [Cluster](#cluster)
* [Options](#options)
* [Events](#events)
* [API](#api)
  * [module(options)](#moduleoptions)
  * [session.get(sid)](#sessiongetsid)
  * [session.set(sid, sess, ttl)](#sessionsetsid-sess-ttl)
  * [session.destroy(sid)](#sessiondestroysid)
  * [session.quit()](#sessionquit)
  * [session.end()](#sessionend)
  * [session.status](#sessionstatus)
  * [session.connected](#sessionconnected)
  * [session.client](#sessionclient)
* [Benchmark](#benchmark)
* [Testing](#testing)
* [License](#license)
* [Contributors](#contributors)


## Install

[npm][]:

```sh
npm install koa-redis
```

[yarn][]:

```sh
yarn add koa-redis
```


## Usage

`koa-redis` works with [koa-generic-session](https://github.com/koajs/generic-session) (a generic session middleware for koa).

For more examples, please see the [examples folder of `koa-generic-session`](https://github.com/koajs/generic-session/tree/master/example).

### Basic

```js
const session = require('koa-generic-session');
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

### Sentinel

```js
const session = require('koa-generic-session');
const redisStore = require('koa-redis');
const koa = require('koa');

const app = koa();
app.keys = ['keys', 'keykeys'];
app.use(session({
  store: redisStore({
    // Options specified here
    // <https://github.com/luin/ioredis#sentinel>
    sentinels: [
      { host: 'localhost', port: 26379 },
      { host: 'localhost', port: 26380 }
      // ...
    ],
    name: 'mymaster'
  })
}));

// ...
```

### Cluster

```js
const session = require('koa-generic-session');
const redisStore = require('koa-redis');
const koa = require('koa');

const app = koa();
app.keys = ['keys', 'keykeys'];
app.use(session({
  store: redisStore({
    // Options specified here
    // <https://github.com/luin/ioredis#cluster>
    isRedisCluster: true,
    nodes: [
      {
        port: 6380,
        host: '127.0.0.1'
      },
      {
        port: 6381,
        host: '127.0.0.1'
      }
      // ...
    ],
    // <https://github.com/luin/ioredis/blob/master/API.md#new-clusterstartupnodes-options>
    clusterOptions: {
      // ...
      redisOptions: {
        // ...
      }
    }
  })
}));

// ...
```


## Options

* _all [`ioredis`](https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options) options_ - Useful things include `url`, `host`, `port`, and `path` to the server. Defaults to `127.0.0.1:6379`
* `db` (number) - will run `client.select(db)` after connection
* `client` (object) - supply your own client, all other options are ignored unless `duplicate` is also supplied
* `duplicate` (boolean) - When true, it will run `client.duplicate()` on the supplied `client` and use all other options supplied. This is useful if you want to select a different DB for sessions but also want to base from the same client object.
* `serialize` - Used to serialize the data that is saved into the store.
* `unserialize` - Used to unserialize the data that is fetched from the store.
* `isRedisCluster` (boolean) - Used for creating a Redis cluster instance per [`ioredis`][cluster] Cluster options, if set to `true`, then a new Redis cluster will be instantiated with `new Redis.Cluster(options.nodes, options.clusterOptions)` (see [Cluster docs][cluster] for more info).
* `nodes` (array) - Conditionally used for creating a Redis cluster instance when `isRedisCluster` option is `true`, this is the first argument passed to `new Redis.Cluster` and contains a list of all the nodes of the cluster ou want to connect to (see [Cluster docs][cluster] for more info).
* `clusterOptions` (object) - Conditionally used for created a Redi cluster instance when `isRedisCluster` option is `true`, this is the second argument passed to `new Redis.Cluster` and contains options, such as `redisOptions` (see [Cluster docs][cluster] for more info).
* **DEPRECATED:** old options - `auth_pass` and `pass` have been replaced with `password`, and `socket` has been replaced with `path`, however all of these options are backwards compatible.


## Events

See the [`ioredis` docs](https://github.com/luin/ioredis#connection-events) for more info.

**Note that as of v4.0.0 the `disconnect` and `warning` events are removed as `ioredis` does not support them.   The `disconnect` event is deprecated, although it is still emitted when `end` events are emitted.**


## API

These are some the functions that `koa-generic-session` uses that you can use manually. You will need to initialize differently than the example above:

```js
const session = require('koa-generic-session');
const redisStore = require('koa-redis')({
  // Options specified here
});
const app = require('koa')();

app.keys = ['keys', 'keykeys'];
app.use(session({
  store: redisStore
}));
```

### module([options](#options))

Initialize the Redis connection with the optionally provided options (see above). _The variable `session` below references this_.

### session.get(sid)

Generator that gets a session by ID. Returns parsed JSON is exists, `null` if it does not exist, and nothing upon error.

### session.set(sid, sess, ttl)

Generator that sets a JSON session by ID with an optional time-to-live (ttl) in milliseconds. Yields `ioredis`'s `client.set()` or `client.setex()`.

### session.destroy(sid)

Generator that destroys a session (removes it from Redis) by ID. Tields `ioredis`'s `client.del()`.

### session.quit()

Generator that stops a Redis session after everything in the queue has completed. Yields `ioredis`'s `client.quit()`.

### session.end()

Alias to `session.quit()`. It is not safe to use the real end function, as it cuts off the queue.

### session.status

String giving the connection status updated using `client.status`.

### session.connected

Boolean giving the connection status updated using `client.status` after any of the events above is fired.

### session.client

Direct access to the `ioredis` client object.


## Benchmark

| Server                  | Transaction rate      | Response time |
| ----------------------- | --------------------- | ------------- |
| connect without session | **6763.56 trans/sec** | **0.01 secs** |
| koa without session     | **5684.75 trans/sec** | **0.01 secs** |
| connect with session    | **2759.70 trans/sec** | **0.02 secs** |
| koa with session        | **2355.38 trans/sec** | **0.02 secs** |

Detailed benchmark report [here](https://github.com/koajs/koa-redis/tree/master/benchmark)


## Testing

1. Start a Redis server on `localhost:6379`. You can use [`redis-windows`](https://github.com/ServiceStack/redis-windows) if you are on Windows or just want a quick VM-based server.
2. Clone the repository and run `npm i` in it (Windows should work fine).
3. If you want to see debug output, turn on the prompt's `DEBUG` flag.
4. Run `npm test` to run the tests and generate coverage. To run the tests without generating coverage, run `npm run-script test-only`.


## License

[MIT](LICENSE) © dead_horse


## Contributors

| Name           | Website                    |
| -------------- | -------------------------- |
| **dead_horse** |                            |
| **Nick Baugh** | <http://niftylettuce.com/> |


## 

[travis-image]: https://img.shields.io/travis/koajs/koa-redis.svg?style=flat-square

[travis-url]: https://travis-ci.org/koajs/koa-redis

[coveralls-image]: https://img.shields.io/coveralls/koajs/koa-redis.svg?style=flat-square

[coveralls-url]: https://coveralls.io/r/koajs/koa-redis?branch=master

[david-image]: https://img.shields.io/david/koajs/koa-redis.svg?style=flat-square&label=deps

[david-url]: https://david-dm.org/koajs/koa-redis

[david-dev-image]: https://img.shields.io/david/dev/koajs/koa-redis.svg?style=flat-square&label=devDeps

[david-dev-url]: https://david-dm.org/koajs/koa-redis#info=devDependencies

[license-image]: https://img.shields.io/npm/l/koa-redis.svg?style=flat-square

[license-url]: https://github.com/koajs/koa-redis/blob/master/LICENSE

[cluster]: https://github.com/luin/ioredis/blob/master/API.md#new-clusterstartupnodes-options

[npm]: https://www.npmjs.com/

[yarn]: https://yarnpkg.com/
