/**!
 * koa-redis - lib/koa-redis.js
 * Copyright(c) 2013
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('koa:redis');
var Redis = require('redis');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Initialize redis session middleware with `opts`:
 *
 * @param {Object} options
 *   - {Object} client    redis client
 *   - {String} host      redis connect host (with out options.client)
 *   - {Number} port      redis connect port (with out options.client)
 *   - {String} socket    redis connect socket (with out options.client)
 *   - {String} db        redis db
 *   - {String} pass      redis password
 */
var RedisStore = module.exports = function (options) {
  if (!(this instanceof RedisStore)) {
    return new RedisStore(options);
  }
  EventEmitter.call(this);
  options = options || {};
  var client;

  if (!options.client) {
    debug('Init redis with host: %s, port: %d, socket: %s',
      options.host || 'localhost', options.port || 6379, options.socket || '');
    client = Redis.createClient(options.port || options.socket,
      options.host, options);
  } else {
    client = options.client;
  }

  options.pass && client.auth(options.pass, function (err) {
    if (err) {
      throw err;
    }
  });

  if (options.db) {
    client.select(options.db);
    client.on("connect", function() {
      client.send_anyways = true;
      client.select(options.db);
      client.send_anyways = false;
    });
  }
  client.on('error', this.emit.bind(this, 'disconnect'));
  client.on('end', this.emit.bind(this, 'disconnect'));
  client.on('connect', this.emit.bind(this, 'connect'));

  //wrap redis
  this._redisClient = client;
  this.client = require('co-redis')(client);
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
    ttl = ttl / 1000;
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

RedisStore.prototype.destroy = function *(sid, sess) {
  debug('DEL %s', sid);
  yield this.client.del(sid);
  debug('DEL %s complete', sid);
};
