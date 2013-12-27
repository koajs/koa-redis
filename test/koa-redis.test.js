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

var Session = require('../');
var koa = require('koa');
var should = require('should');

var session;

describe('lib/koa-redis', function () {

  describe('generate client', function () {
    it('should generate session ok without client', function () {
      session = Session();
      session.should.be.a.Function;
      session.constructor.name.should.equal('GeneratorFunction');
    });
  });
});