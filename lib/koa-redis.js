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
var oneDay = 86400;

/**
 * Initialize redis session middleware with `opts`:
 *
 * @param {Object} options
 *   - {String} prefix    session prefix, defaulting to koa:sess:
 *   - {String} pass      redis password
 *   - {Object} client    redis client
 *   - {String} host      redis connect host (with out options.client)
 *   - {Number} port      redis connect port (with out options.client)
 *   - {String} socket    redis connect socket (with out options.client)
 *   - {String} db        redis db
 *   - {Number} ttl       redis ttl, defaulting to one day
 */
var RedisStore = module.exports = function (options) {
  if (!(this instanceof RedisStore)) {
    return new RedisStore(options);
  }
  EventEmitter.call(this);
  options = options || {};
  this.prefix = options.prefix || 'koa:sass:';
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

  this.ttl =  options.ttl === undefined ? oneDay : options.ttl;

  if (options.db) {
    client.select(options.db);
    client.on("connect", function() {
      client.send_anyways = true;
      client.select(options.db);
      client.send_anyways = false;
    });
  }
  client.on('error', this.emit.bind(this, 'disconnect'));
  client.on('connect', this.emit.bind(this, 'connect'));

  //wrap redis
  this._redisClient = client;
  this.client = require('co-redis')(client);
};

util.inherits(RedisStore, EventEmitter);

RedisStore.prototype.get = function *(sid) {
  var data;
  sid = this.prefix + sid;
  debug('GET %s', sid);
  data = yield this.client.get(sid);
  if (!data) {
    debug('GET empty');
    return null;
  }
  try {
    data = JSON.parse(data.toString());
  } catch (err) {
    return null;
  }
  if (data && data.cookie && data.cookie.expires) {
    data.cookie.expires = new Date(data.cookie.expires);
  }
  debug('GOT %j', data);
  return data;
};

RedisStore.prototype.mget = function *(ids) {
  debug('MGET %j', ids)
  var items, data, prefix = this.prefix
  ids = ids.map(function(sid) { return prefix + sid })
  items = yield this.client.mget(ids);
  data = ids.map(function(sid, i) {
    try {
      if (items[i] != null) {
        return JSON.parse(items[i]);
      }
    } catch (e) {}
    return null;
  });
  debug('GOT %j', data)
  return data
}

RedisStore.prototype.set = function *(sid, sess) {
  var ttl = this.ttl;
  //compat connect-redis type `maxAge`
  var maxage = sess.cookie && (sess.cookie.maxage || sess.cookie.maxAge);
  if (typeof maxage === 'number') {
    ttl = maxage / 1000;
  }
  // if has cookie.expires, ignore cookie.maxage
  if (sess.cookie && sess.cookie.expires) {
    ttl = Math.ceil((sess.cookie.expires.getTime() - Date.now()) / 1000);
  }
  sid = this.prefix + sid;
  sess = JSON.stringify(sess);
  if (ttl) {
    debug('SETEX %s %s', sid, ttl, sess);
    yield this.client.setex(sid, ttl, sess);
  } else {
    debug('SET %s %s', sid, sess);
    yield this.client.set(sid, sess);
  }
  debug('SET %s complete', sid);
};

RedisStore.prototype.destroy = function *(sid, sess) {
  sid = this.prefix + sid;
  debug('DEL %s', sid);
  yield this.client.del(sid);
  debug('DEL %s complete', sid);
};
