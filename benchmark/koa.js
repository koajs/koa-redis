'use strict';

const Koa = require('koa');
const session = require('koa-session');
const RedisStore = require('../');

const app = new Koa();

app.keys = [ 'keys', 'keykeys' ];

if (process.argv[2] !== 'nosession') {
  app.use(session({
    store: new RedisStore(),
  }, app));
}

app.use(ctx => {
  ctx.session = ctx.session || {};
  ctx.session.name = 'koa-redis';
  ctx.body = ctx.session.name;
});

require('http').createServer(app.callback()).listen(8080);
console.log('server start listen at 8080');
