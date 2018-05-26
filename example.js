'use strict';

const Koa = require('koa');
const session = require('koa-session');
const RedisStore = require('./'); // koa-redis

const app = new Koa();
app.keys = [ 'keys', 'keykeys' ];

const store = new RedisStore({
  // Options specified here
});

app.use(session({ store }, app));

app.use(ctx => {
  switch (ctx.path) {
    case '/get':
      get(ctx);
      break;
    case '/remove':
      remove(ctx);
      break;
    case '/regenerate':
      regenerate(ctx);
      break;
    default:
      ctx.error = 404;
      break;
  }
});


function get(ctx) {
  const session = ctx.session;
  session.count = session.count || 0;
  session.count++;

  ctx.body = session.count;
}

function remove(ctx) {
  ctx.session = null;
  ctx.body = 0;
}

function regenerate(ctx) {
  ctx.session = null;
  ctx.redirect('/get');
}

app.listen(8080);
