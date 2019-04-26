/** !
 * koa-redis - index.js
 * Copyright(c) 2015
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

/**
 * Module dependencies.
 */

const util = require('util');
const { EventEmitter } = require('events');
const debug = require('debug')('koa-redis');
const Redis = require('ioredis');
const redisWrapper = require('co-redis');
const wrap = require('co-wrap-all');

/**
 * Initialize redis session middleware with `opts` (see the README for more info):
 *
 * @param {Object} options
 *   - {Boolean} isRedisCluster redis is cluster
 *   - {Object} client       redis client (overides all other options except db and duplicate)
 *   - {String} socket       redis connect socket (DEPRECATED: use 'path' instead)
 *   - {String} db           redis db
 *   - {Boolean} duplicate   if own client object, will use node redis's duplicate function and pass other options
 *   - {String} password     redis password
 *   - {Any} [any]           all other options including above are passed to ioredis
 * @returns {Object} Redis instance
 */
function RedisStore(options) {
  if (!(this instanceof RedisStore)) {
    return new RedisStore(options);
  }

  EventEmitter.call(this);
  options = options || {};

  let client;
  options.password =
    options.password || options.auth_pass || options.pass || null; // For backwards compatibility
  options.path = options.path || options.socket || null; // For backwards compatibility
  if (!options.client) {
    debug('Init redis new client');
    //
    // TODO: we should probably omit custom options we have
    // in this lib from `options` passed to instances below
    //
    if (options.isRedisCluster) {
      client = new Redis.Cluster(options.nodes, options.clusterOptions);
    } else {
      client = new Redis(options);
    }
  } else if (options.duplicate) {
    // Duplicate client and update with options provided
    debug('Duplicating provided client with new options (if provided)');
    const dupClient = options.client;
    delete options.client;
    delete options.duplicate;
    client = dupClient.duplicate(options); // Useful if you want to use the DB option without adjusting the client DB outside koa-redis
  } else {
    debug('Using provided client');
    client = options.client;
  }

  if (options.db) {
    debug('selecting db %s', options.db);
    client.select(options.db);
    client.on('connect', () => {
      client.send_anyways = true;
      client.select(options.db);
      client.send_anyways = false;
    });
  }

  client.on('error', this.emit.bind(this, 'error'));
  client.on('end', this.emit.bind(this, 'end'));
  client.on('end', this.emit.bind(this, 'disconnect')); // For backwards compatibility
  client.on('connect', this.emit.bind(this, 'connect'));
  client.on('reconnecting', this.emit.bind(this, 'reconnecting'));
  client.on('ready', this.emit.bind(this, 'ready'));
  client.on('warning', this.emit.bind(this, 'warning'));
  this.on('connect', function() {
    debug('connected to redis');
    this.connected = client.connected;
  });
  this.on('ready', () => {
    debug('redis ready');
  });
  this.on('end', function() {
    debug('redis ended');
    this.connected = client.connected;
  });
  // No good way to test error
  /* istanbul ignore next */
  this.on('error', function() {
    debug('redis error');
    this.connected = client.connected;
  });
  // No good way to test reconnect
  /* istanbul ignore next */
  this.on('reconnecting', function() {
    debug('redis reconnecting');
    this.connected = client.connected;
  });
  // No good way to test warning
  /* istanbul ignore next */
  this.on('warning', function() {
    debug('redis warning');
    this.connected = client.connected;
  });

  // Wrap redis
  this._redisClient = client;
  this.client = redisWrapper(client);
  this.connected = client.connected;

  // Support optional serialize and unserialize
  this.serialize =
    (typeof options.serialize === 'function' && options.serialize) ||
    JSON.stringify;
  this.unserialize =
    (typeof options.unserialize === 'function' && options.unserialize) ||
    JSON.parse;
}

util.inherits(RedisStore, EventEmitter);

RedisStore.prototype.get = function*(sid) {
  const data = yield this.client.get(sid);
  debug('get session: %s', data || 'none');
  if (!data) {
    return null;
  }

  try {
    return this.unserialize(data.toString());
  } catch (err) {
    // ignore err
    debug('parse session error: %s', err.message);
  }
};

RedisStore.prototype.set = function*(sid, sess, ttl) {
  if (typeof ttl === 'number') {
    ttl = Math.ceil(ttl / 1000);
  }

  sess = this.serialize(sess);
  if (ttl) {
    debug('SETEX %s %s %s', sid, ttl, sess);
    yield this.client.setex(sid, ttl, sess);
  } else {
    debug('SET %s %s', sid, sess);
    yield this.client.set(sid, sess);
  }

  debug('SET %s complete', sid);
};

RedisStore.prototype.destroy = function*(sid) {
  debug('DEL %s', sid);
  yield this.client.del(sid);
  debug('DEL %s complete', sid);
};

RedisStore.prototype.quit = function*() {
  // End connection SAFELY
  debug('quitting redis client');
  yield this.client.quit();
};

wrap(RedisStore.prototype);

RedisStore.prototype.end = RedisStore.prototype.quit; // End connection SAFELY. The real end() command should never be used, as it cuts off to queue.

module.exports = RedisStore;
