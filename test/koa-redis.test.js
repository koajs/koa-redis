/**!
 * koa-redis - test/koa-redis.test.js
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

var store = require('../')();
var should = require('should');
var co = require('co');

describe('test/koa-redis.test.js', function () {
  it('should set with ttl ok', function (done) {
    co(function *() {
      yield store.set('key:ttl', {a: 1}, 86400000);
      (yield store.get('key:ttl')).should.eql({a: 1});
      (yield store.client.ttl('key:ttl')).should.equal(86400);
      done();
    })();
  });

  it('should set without ttl ok', function (done) {
    co(function *() {
      yield store.set('key:nottl', {a: 1});
      (yield store.get('key:nottl')).should.eql({a: 1});
      (yield store.client.ttl('key:nottl')).should.equal(-1);
      done();
    })();
  });
  it('should destroy ok', function (done) {
    co(function *() {
      yield store.destroy('key:nottl');
      yield store.destroy('key:ttl');
      should.not.exist(yield store.get('key:nottl'));
      should.not.exist(yield store.get('key:ttl'));
      done();
    })();
  });

  it('should expire after 1s', function (done) {
    co(function *() {
      yield store.set('key', {a: 1}, 1000);
      function sleep(t) {
        return function (done) {
          setTimeout(done, t);
        }
      }
      yield sleep(1000);
      should.not.exist(yield store.get('key'));
      done();
    })();
  });
});
