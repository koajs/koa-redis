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

describe('test/lib/koa-redis.test.js', function () {
  it('should set ok', function (done) {
    co(function *() {
      yield store.set('key', {a: 1});
      (yield store.get('key')).should.eql({a: 1});
      (yield store.client.ttl(store.prefix + 'key')).should.equal(86400);
      done();
    })();
  });

  it('should destroy ok', function (done) {
    co(function *() {
      yield store.destroy('key');
      should.not.exist(yield store.get('key'));
      done();
    })();
  });

  it('should set with cookie.maxAge ok', function (done) {
    co(function *() {
      yield store.set('key', {a: 1, cookie: {maxAge: 1000}});
      (yield store.get('key')).should.eql({a: 1, cookie: {maxAge: 1000}});
      (yield store.client.ttl(store.prefix + 'key')).should.equal(1);
      done();
    })();
  });

  it('should set with cookie.maxage ok', function (done) {
    co(function *() {
      yield store.set('key', {a: 1, cookie: {maxage: 1000}});
      (yield store.get('key')).should.eql({a: 1, cookie: {maxage: 1000}});
      (yield store.client.ttl(store.prefix + 'key')).should.equal(1);
      done();
    })();
  });

  it('should set with cookie.expires ok', function (done) {
    co(function *() {
      var expires = new Date(Date.now() + 1000);
      yield store.set('key', {a: 1, cookie: {expires: expires}});
      (yield store.get('key')).should.eql({a: 1, cookie: {expires: expires}});
      (yield store.client.ttl(store.prefix + 'key')).should.equal(1);
      done();
    })();
  });

  it('should expire after 2s', function (done) {
    co(function *() {
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
