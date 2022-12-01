/** !
 * koa-redis - test/koa-redis.test.js
 * Copyright(c) 2015
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

/**
 * Module dependencies.
 */

const should = require('should');
const Redis = require('ioredis');

// allow the default url to be overriden for local testing
const redisUrl = process.env.REDIS_URL ? process.env.REDIS_URL : 'redis://localhost:6379/';

function event(object, name) {
  // Convert events to promises
  return new Promise(resolve => {
    object.once(name, resolve);
  });
}

describe('test/koa-redis.test.js', () => {
  it('should connect and ready with external client and quit ok', function*() {
    const store = require('..')({ client: new Redis(redisUrl) });
    yield event(store, 'connect');
    store.connected.should.eql(true);
    yield event(store, 'ready');
    yield store.quit();
    yield event(store, 'end');
    store.connected.should.eql(false);
  });

  it('should connect and ready with duplicated external client and disconnect ok', function*() {
    const store = require('..')({
      client: new Redis(redisUrl),
      duplicate: true
    });
    yield event(store, 'connect');
    store.connected.should.eql(true);
    yield event(store, 'ready');
    yield store.end(true);
    yield event(store, 'disconnect');
    store.connected.should.eql(false);
  });

  it('should connect and ready with url and quit ok', function*() {
    const store = require('..')({
      url: redisUrl
    });
    yield event(store, 'connect');
    store.connected.should.eql(true);
    yield event(store, 'ready');
    yield store.quit();
    yield event(store, 'end');
    store.connected.should.eql(false);
  });

  it('should set and delete with db ok', function*() {
    const store = require('..')({ db: 2, url: redisUrl });
    const client = new Redis(redisUrl);
    client.select(2);
    yield store.set('key:db1', { a: 2 });
    (yield store.get('key:db1')).should.eql({ a: 2 });
    JSON.parse(yield client.get('key:db1')).should.eql({ a: 2 });
    yield store.destroy('key:db1');
    should.not.exist(yield store.get('key:db1'));
    should.not.exist(yield client.get('key:db1'));
    yield store.quit();
  });

  it('should set with ttl ok', function*() {
    const store = require('..')({url: redisUrl});
    yield store.set('key:ttl', { a: 1 }, 86400000);
    (yield store.get('key:ttl')).should.eql({ a: 1 });
    (yield store.client.ttl('key:ttl')).should.equal(86400);
    yield store.quit();
  });

  it('should not throw error with bad JSON', function*() {
    const store = require('..')({url: redisUrl});
    yield store.client.set('key:badKey', '{I will cause an error!}');
    should.not.exist(yield store.get('key:badKey'));
    yield store.quit();
  });

  it('should use default JSON.parse/JSON.stringify without serialize/unserialize function', function*() {
    const store = require('..')({
      serialize: 'Not a function',
      unserialize: 'Not a function',
      url: redisUrl
    });
    yield store.set('key:notserialized', { a: 1 });
    (yield store.get('key:notserialized')).should.eql({ a: 1 });
    yield store.quit();
  });

  it('should parse bad JSON with custom unserialize function', function*() {
    const store = require('..')({
      serialize: value => 'JSON:' + JSON.stringify(value),
      unserialize: value => JSON.parse(value.slice(5)),
      url: redisUrl
    });
    yield store.set('key:notserialized', { a: 1 });
    (yield store.get('key:notserialized')).should.eql({ a: 1 });
    yield store.quit();
  });

  it('should set without ttl ok', function*() {
    const store = require('..')({url: redisUrl});
    yield store.set('key:nottl', { a: 1 });
    (yield store.get('key:nottl')).should.eql({ a: 1 });
    (yield store.client.ttl('key:nottl')).should.equal(-1);
    yield store.quit();
  });

  it('should destroy ok', function*() {
    const store = require('..')({url: redisUrl});
    yield store.destroy('key:nottl');
    yield store.destroy('key:ttl');
    yield store.destroy('key:badKey');
    should.not.exist(yield store.get('key:nottl'));
    should.not.exist(yield store.get('key:ttl'));
    should.not.exist(yield store.get('key:badKey'));
    yield store.quit();
  });

  it('should expire after 1s', function*() {
    this.timeout(2000);
    function sleep(t) {
      return new Promise(resolve => {
        setTimeout(resolve, t);
      });
    }

    const store = require('..')({url: redisUrl});
    yield store.set('key:ttl2', { a: 1, b: 2 }, 1000);
    yield sleep(1200); // Some odd delay introduced by co-mocha
    should.not.exist(yield store.get('key:ttl2'));
    yield store.quit();
  });
});
