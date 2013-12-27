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

var oneDay = 86400;

/**
 * Initialize redis session middleware with `opts`:
 * 
 * @param {Object} options
 *   - {String} prefix    session prefix
 *   - {String} pass      redis password
 *   - {Object} client    redis client wrap by redis-co
 *   - {String} host      redis connect host (with out options.client)
 *   - {Number} port      redis connect port (with out options.client)
 *   - {String} socket    redis connect socket (with out options.client)
 *   - {String} db        redis db
 *   - {Number} ttl       redis ttl
 */
module.exports = function (options) {
  options = options || {};
  options.prefix = options.prefix || 'koa:sass';

  var client;
  if (!options.client) {
    debug('Init redis with host: %s, port: %d, socket: %s', 
      options.host || 'localhost', options.port || 6379, options.socket || '');

    var Redis = require('redis');
    var wraper = require('co-redis');
    client = wraper(Redis.createClient(options.port || options.socket, 
      options.host, options));
  } else {
    client = options.client;
  }

  options.pass && client.auth(options.pass)(function (err) {
    if (err) {
      throw err;
    }
  });

  return function *(next) {

  };
};
