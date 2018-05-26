/**
 * koa-redis - index.js
 * Copyright(c) 2013-2018
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

const redis = require('redis');
const debug = require('debug')('koa-redis');
const EventEmitter = require('events').EventEmitter;
const { promisify } = require('util');

/**
 * @extends EventEmitter
 */
module.exports = class RedisStore extends EventEmitter {
  /**
   * @param {Object} options The options for creating a new RedisStore
   * @param {Object} options.client Redis client (overides all other options except db and duplicate)
   * @param {String} options.db The Redis database to use
   * @param {Boolean} options.duplicate If own client object, will use node Redis' duplicate function and pass other options
   * @param {String} options.password Redis password (use of 'auth_pass' is also permitted)
   * @param {String} options.path The UNIX socket string of the Redis server
   * @param {Any} options.[any] All other options including above are passed to node_redis
   */
  constructor(options) {
    super();

    if (!this instanceof RedisStore) {
      return new RedisStore(options);
    }

    options = options || {};
    options.path = options.path || null;
    options.password = options.password || options.auth_pass || null; // For backwards compatibility

    let client;

    if (!options.client) {
      debug('Initializing redis new client');
      client = redis.createClient(options);
    } else {
      if (options.duplicate) { // Duplicate client and update with options provided
        debug('Duplicating provided client with new options (if provided)');
        const dupClient = options.client;
        delete options.client;
        delete options.duplicate;
        client = dupClient.duplicate(options); // Useful if you want to use the DB option without adjusting the client DB outside koa-redis
      } else {
        debug('Using provided client');
        client = options.client;
      }
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

    this.on('connect', () => {
      debug('connected to redis');
      this.connected = client.connected;
    });

    this.on('ready', () => {
      debug('redis ready');
    });

    this.on('end', () => {
      debug('redis ended');
      this.connected = client.connected;
    });

    this.on('error', () => {
      debug('redis error');
      this.connected = client.connected;
    });

    this.on('reconnecting', () => {
      debug('redis reconnecting');
      this.connected = client.connected;
    });

    this.on('warning', () => {
      debug('redis warning');
      this.connected = client.connected;
    });

    this._redisClient = client;

    // Promisify all the client methods we care about (ie. the ones we use)
    [ 'get', 'set', 'setex', 'del' ].forEach(method => {
      client[method] = promisify(client[method]).bind(client);
    });

    this.client = client;
    this.connected = client.connected;

    // Support optional serialize and unserialize
    this.serialize = (typeof options.serialize === 'function' && options.serialize) || JSON.stringify;
    this.unserialize = (typeof options.unserialize === 'function' && options.unserialize) || JSON.parse;
  }

  /**
   * @param {String} sid The session key to retrieve
   * @return {(String | null)} The session value retrieved
   */
  async get(sid) {
    const value = await this.client.get(sid);
    debug('get session: %s', value || 'none');

    if (!value) {
      return null;
    }

    try {
      return this.unserialize(value.toString());
    } catch (err) {
      // ignore error
      debug('parse session error: %s', err.message);
    }
  }

  /**
   * @param {String} sid The session key to set
   * @param {Object} sess The session value to store
   * @param {Number} ttl The max-age (in ms) the key will live for before expiring
   * @return {void}
   */
  async set(sid, sess, ttl) {
    if (typeof ttl === 'number') {
      ttl = Math.ceil(ttl / 1000);
    }

    sess = this.serialize(sess);

    if (ttl) {
      debug('SETEX %s %s %s', sid, ttl, sess);
      await this.client.setex(sid, ttl, sess);
    } else {
      debug('SET %s %s', sid, sess);
      await this.client.set(sid, sess);
    }
    debug('SET %s complete', sid);
  }

  /**
   * @param {String} sid The session key to destroy
   * @return {void}
   */
  async destroy(sid) {
    debug('DEL %s', sid);
    await this.client.del(sid);
    debug('DEL %s complete', sid);
  }

  /**
   * @return {void}
   */
  async quit() { // End connection SAFELY
    debug('quitting redis client');
    await this.client.quit();
  }

  /**
   * @return {void}
   */
  async end() {
    await this.quit();
  }
};
