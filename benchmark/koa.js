const Koa = require('koa');
const session = require('koa-session');
const redisStore = require('../src');

const app = new Koa();

app.keys = ['keys', 'keykeys'];
if (process.argv[2] !== 'nosession') {
  app.use(
    session(
      {
        store: redisStore()
      },
      app
    )
  );
}

app.use(function() {
  this.session = this.session || {};
  this.session.name = 'koa-redis';
  this.body = this.session.name;
});

require('http')
  .createServer(app.callback())
  .listen(8080);

console.log('server start listen at 8080');
