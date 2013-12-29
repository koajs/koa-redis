var koa = require('koa');
var session = require('koa-sess');
var redisStore = require('../');

var app = koa();

app.keys = ['keys', 'keykeys'];
if (process.argv[2] !== 'nosession') {
  app.use(session({
    store: redisStore()
  }));
}

app.use(function *() {
  this.session = this.session || {};
  this.session.name = 'koa-redis';
  this.body = this.session.name;
});

require('http').createServer(app.callback()).listen(8080);
console.log('server start listen at 8080');
