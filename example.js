/**!
 * koa-redis - example.js
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

var koa = require('koa');
var http = require('http');
var session = require('koa-sess');
var redisStore = require('./');

var app = koa();

app.name = 'koa-session-test';
app.outputErrors = true;
app.keys = ['keys', 'keykeys'];
app.proxy = true; // to support `X-Forwarded-*` header

app.use(session({
  store: redisStore()
}));

app.use(function *() {
  this.session.name = 'koa-redis';
  this.body = this.session.name;
});

app.on('error', function (err) {
  console.error(err.stack);
});

var app = module.exports = http.createServer(app.callback());
app.listen(8080);
