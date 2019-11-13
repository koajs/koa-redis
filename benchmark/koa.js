const Keygrip = require('keygrip');
const Koa = require('koa');
const session = require('koa-session');
const redisStore = require('../src');

const app = new Koa();

app.keys = new Keygrip(['aibiizae0oetheiz9naepeiz6Ogheepowaehia4kengahz2oic4xep0be2fu0dah', 'Aew0heishieSeivekoosharooPei8aeg4phacheegh3ieLai9xahPhaet5Ezoo7p'], 'sha512');
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
