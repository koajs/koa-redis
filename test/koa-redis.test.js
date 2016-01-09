/**!
 * koa-redis - test/koa-redis.test.js
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

var should = require('should');
require('co-mocha');
var redis = require('redis');
var redisWrapper = require('co-redis');

function event(object, name) {              // Convert events to promises
  return new Promise(function(resolve) {
    object.once(name, resolve);
  });
}

describe('test/koa-redis.test.js', function () {
  it('should connect and ready with external client and quit ok', function* () {
    var store = require('../')({client: redis.createClient()});
    yield event(store, 'connect');
    store.connected.should.eql(true);
    yield event(store, 'ready');
    yield store.quit();
    yield event(store, 'end');
    store.connected.should.eql(false);
  });
  
  it('should connect and ready with duplicated external client and disconnect ok', function* () {
    var store = require('../')({
      client: redis.createClient(),
      duplicate: true
    });
    yield event(store, 'connect');
    store.connected.should.eql(true);
    yield event(store, 'ready');
    yield store.end()
    yield event(store, 'disconnect');
    store.connected.should.eql(false);
  });
  
  it('should set with db ok', function* () {
    var store = require('../')({db: 2});
    var client = redis.createClient();
    client.select(2);
    client = redisWrapper(client);
    yield store.set('key:db1', {a: 1});
    (yield store.get('key:db1')).should.eql({a: 1});
    JSON.parse(yield client.get('key:db1')).should.eql({a: 1});
    yield store.quit();
  });
  
  it('should set with ttl ok', function* () {
    var store = require('../')();
    yield store.set('key:ttl', {a: 1}, 86400000);
    (yield store.get('key:ttl')).should.eql({a: 1});
    (yield store.client.ttl('key:ttl')).should.equal(86400);
    yield store.quit();
  });
  
  it('should not throw error with bad JSON', function* () {
    var store = require('../')();
    yield store.client.set('key:badKey', '{I will cause an error!}');
    should.not.exist(yield store.get('key:badKey'));
    yield store.quit();
  });

  it('should set without ttl ok', function* () {
    var store = require('../')();
    yield store.set('key:nottl', {a: 1});
    (yield store.get('key:nottl')).should.eql({a: 1});
    (yield store.client.ttl('key:nottl')).should.equal(-1);
    yield store.quit();
  });
  
  it('should destroy ok', function* () {
    var store = require('../')();
    yield store.destroy('key:nottl');
    yield store.destroy('key:ttl');
    yield store.destroy('key:badKey');
    should.not.exist(yield store.get('key:nottl'));
    should.not.exist(yield store.get('key:ttl'));
    should.not.exist(yield store.get('key:badKey'));
    yield store.quit();
  });
  
  it('should expire after 1s', function* () {
    this.timeout(2000);
    function sleep(t) { return new Promise(function(resolve) { setTimeout(resolve, t); }); }
    
    var store = require('../')();
    yield store.set('key:ttl2', {a: 1, b: 2}, 1000);
    yield sleep(1200);                                 // Some odd delay introduced by co-mocha
    should.not.exist(yield store.get('key:ttl2'));
    yield store.quit();
  });
});
