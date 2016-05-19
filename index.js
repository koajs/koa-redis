/**!
 * koa-redis - index.js
 * Copyright(c) 2015
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('koa-redis');
var redis = require('redis');
var redisWrapper = require('co-redis');
var util = require('util');

/**
 * Initialize redis session middleware with `opts` (see the README for more info):
 *
 * @param {Object} options
 *   - {Object} client       redis client (overides all other options except db and duplicate)
 *   - {String} socket       redis connect socket (DEPRECATED: use 'path' instead)
 *   - {String} db           redis db
 *   - {Boolean} duplicate   if own client object, will use node redis's duplicate function and pass other options
 *   - {String} pass         redis password (DEPRECATED: use 'auth_pass' instead)
 *   - {Any} [any]           all other options inclduing above are passed to node_redis
 */
var RedisStore = module.exports = function (options) {
  if (!(this instanceof RedisStore)) {
    return new RedisStore(options);
  }
  EventEmitter.call(this);
  options = options || {};

  var client;
  options.auth_pass = options.auth_pass || options.pass || null;     // For backwards compatibility
  options.path = options.path || options.socket || null;             // For backwards compatibility
  if (!options.client) {
    debug('Init redis new client');
    client = redis.createClient(options);
  } else {
    if (options.duplicate) {                                         // Duplicate client and update with options provided
      debug('Duplicating provided client with new options (if provided)');
      var dupClient = options.client;
      delete options.client;
      delete options.duplicate;
      client = dupClient.duplicate(options);                         // Useful if you want to use the DB option without adjusting the client DB outside koa-redis
    } else {
      debug('Using provided client');
      client = options.client;
    }
  }

  if (options.db) {
    debug('selecting db %s', options.db)
    client.select(options.db);
    client.on('connect', function() {
      client.send_anyways = true;
      client.select(options.db);
      client.send_anyways = false;
    });
  }

  client.on('error', this.emit.bind(this, 'error'));
  client.on('end', this.emit.bind(this, 'end'));
  client.on('end', this.emit.bind(this, 'disconnect'));              // For backwards compatibility
  client.on('connect', this.emit.bind(this, 'connect'));
  client.on('reconnecting', this.emit.bind(this, 'reconnecting'));
  client.on('ready', this.emit.bind(this, 'ready'));
  client.on('warning', this.emit.bind(this, 'warning'));
  this.on('connect', function() {
    debug('connected to redis');
    this.connected = client.connected;
  });
  this.on('ready', function() {
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

  //wrap redis
  this._redisClient = client;
  this.client = redisWrapper(client);
  this.connected = client.connected;
};

util.inherits(RedisStore, EventEmitter);

RedisStore.prototype.get = function *(sid) {
  var data = yield this.client.get(sid);
  debug('get session: %s', data || 'none');
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data.toString());
  } catch (err) {
    // ignore err
    debug('parse session error: %s', err.message);
  }
};

RedisStore.prototype.set = function *(sid, sess, ttl) {
  if (typeof ttl === 'number') {
    ttl = Math.ceil(ttl / 1000);
  }
  sess = JSON.stringify(sess);
  if (ttl) {
    debug('SETEX %s %s %s', sid, ttl, sess);
    yield this.client.setex(sid, ttl, sess);
  } else {
    debug('SET %s %s', sid, sess);
    yield this.client.set(sid, sess);
  }
  debug('SET %s complete', sid);
};

RedisStore.prototype.destroy = function *(sid) {
  debug('DEL %s', sid);
  yield this.client.del(sid);
  debug('DEL %s complete', sid);
};

RedisStore.prototype.quit = function* () {                         // End connection SAFELY
  debug('quitting redis client');
  yield this.client.quit();
};

RedisStore.prototype.end = RedisStore.prototype.quit;              // End connection SAFELY. The real end() command should never be used, as it cuts off to queue.
