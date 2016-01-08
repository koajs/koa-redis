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
var co = require('co');
var redis = require('redis');
var redisWrapper = require('co-redis');

describe('test/koa-redis.test.js', function () {
  it('should connect and ready with external client and quit ok', function (done) {
    var store = require('../')({client: redis.createClient()});
    store.once('connect', function() {
      store.connected.should.eql(true);
      store.once('ready', function() {
        co.wrap(function *() {
          yield store.quit();
        })();
      });
      store.once('end', function() {
        store.connected.should.eql(false);
        done();
      });
    });
  });
  
  it('should connect and ready with duplicated external client and disconnect ok', function (done) {
    var store = require('../')({
      client: redis.createClient(),
      duplicate: true
    });
    store.once('connect', function() {
      store.connected.should.eql(true);
      store.on('ready', function() {
        co.wrap(function *() {
          yield store.end();
        })();
      });
      store.once('disconnect', function() {
        store.connected.should.eql(false);
        done();
      });
    });
  });
  
  it('should set with db ok', function (done) {
    var store = require('../')({db: 2});
    var client = redis.createClient();
    client.select(2);
    client = redisWrapper(client);
    co.wrap(function *() {
      yield store.set('key:db1', {a: 1});
      (yield store.get('key:db1')).should.eql({a: 1});
      JSON.parse(yield client.get('key:db1')).should.eql({a: 1});
      yield store.quit();
      done();
    })();
  });
  
  it('should set with ttl ok', function (done) {
    var store = require('../')();
    co.wrap(function *() {
      yield store.set('key:ttl', {a: 1}, 86400000);
      (yield store.get('key:ttl')).should.eql({a: 1});
      (yield store.client.ttl('key:ttl')).should.equal(86400);
      yield store.quit();
      done();
    })();
  });
  
  it('should not throw error with bad JSON', function (done) {
    var store = require('../')();
    co.wrap(function *() {
      yield store.client.set('key:badKey', '{I will cause an error!}');
      should.not.exist(yield store.get('key:badKey'));
      yield store.quit();
      done();
    })();
  });

  it('should set without ttl ok', function (done) {
    var store = require('../')();
    co.wrap(function *() {
      yield store.set('key:nottl', {a: 1});
      (yield store.get('key:nottl')).should.eql({a: 1});
      (yield store.client.ttl('key:nottl')).should.equal(-1);
      yield store.quit();
      done();
    })();
  });
  
  it('should destroy ok', function (done) {
    var store = require('../')();
    co.wrap(function *() {
      yield store.destroy('key:nottl');
      yield store.destroy('key:ttl');
      yield store.destroy('key:badKey');
      should.not.exist(yield store.get('key:nottl'));
      should.not.exist(yield store.get('key:ttl'));
      should.not.exist(yield store.get('key:badKey'));
      yield store.quit();
      done();
    })();
  });

  it('should expire after 1s', function (done) {
    var store = require('../')();
    co.wrap(function *() {
      yield store.set('key:ttl2', {a: 1, b: 2}, 1000);
      function sleep(t) {
        return function (done) {
          setTimeout(done, t);
        }
      }
      yield sleep(1000);
      should.not.exist(yield store.get('key1'));
      yield store.quit();
      done();
    })();
  });
});
