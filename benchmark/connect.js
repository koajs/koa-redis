'use strict';

const connect = require('connect');
const RedisStore = require('connect-redis')(connect);

const app = connect();
app.use(connect.cookieParser());

if (process.argv[2] !== 'nosession') {
  app.use(connect.session({
    secret: 'session secret',
    store: new RedisStore(),
  }));
}

app.use((req, res) => {
  req.session = req.session || {};
  req.session.name = 'conncet-redis';
  res.end(req.session.name);
});

require('http').createServer(app).listen(8081);
console.log('server start listen at 8081');
