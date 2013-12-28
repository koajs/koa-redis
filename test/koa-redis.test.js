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
  describe('set()', function () {
    it('should set ok', function (done) {
      co(function *() {
        yield store.set('key', {a: 1});
        (yield store.get('key')).should.eql({a: 1});
        done();
      })();
    });
  });
});
