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
 *   - {String} prefix    session prefix
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
  this.prefix = options.prefix || 'koa:sass';
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

  this.ttl =  options.ttl;

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
  try {
    data = yield this.client.get(sid);
    if (!data) {
      return null;
    }
    data = JSON.parse(data.toString());
    debug('GOT %j', data);
    return data;
  } catch (err) {
    return err;
  }
};

RedisStore.prototype.set = function *(sid, sess) {
  try {
    sid = this.prefix + sid;
    sess = JSON.stringify(sess);
    var ttl = this.ttl || oneDay;
    debug('SETEX %s, ttl: %s, %s', sid, ttl, sess);    
    yield this.client.setex(sid, ttl, sess);
  } catch (err) {
    return err;
  }
  debug('SETEX complete');
};

RedisStore.prototype.destroy = function *(sid, sess) {
  sid = this.prefix + sid;
  debug('DEL %s', sid);
  try {
    yield this.client.del(sid);
  } catch (err) {
    return err;
  }
  debug('DEL complete');
};
