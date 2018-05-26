/**
 * koa-redis - test/koa-redis.test.js
 * Copyright(c) 2013-2018
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

const redis = require('redis');
const should = require('should');
const RedisStore = require('../');
const { promisify } = require('util');

function event(object, name) { // Convert events to promises
  return new Promise(resolve => object.once(name, resolve));
}

describe('test/koa-redis.test.js', async () => {
  it('should connect and ready with external client and quit ok', async () => {
    const store = new RedisStore({
      client: redis.createClient(),
    });
    await event(store, 'connect');
    store.connected.should.eql(true);
    await event(store, 'ready');
    await store.quit();
    await event(store, 'end');
    store.connected.should.eql(false);
  });

  it('should connect and ready with duplicated external client and disconnect ok', async () => {
    const store = new RedisStore({
      client: redis.createClient(),
      duplicate: true,
    });
    await event(store, 'connect');
    store.connected.should.eql(true);
    await event(store, 'ready');
    await store.end(true);
    await event(store, 'disconnect');
    store.connected.should.eql(false);
  });

  it('should destroy ok', async () => {
    const store = new RedisStore();
    await store.set('key:destroy', { a: 1, b: 2 });
    (await store.get('key:destroy')).should.eql({ a: 1, b: 2 });
    await store.destroy('key:destroy');
    should.not.exist(await store.get('key:destroy'));
    await store.quit();
  });

  it('should set and delete with db ok', async () => {
    const client = redis.createClient({ db: 2 });
    client.get = promisify(client.get).bind(client);
    const store = new RedisStore({ db: 2 });
    await store.set('key:db1', { a: 2 });
    (await store.get('key:db1')).should.eql({ a: 2 });
    JSON.parse(await client.get('key:db1')).should.eql({ a: 2 });
    await store.destroy('key:db1');
    should.not.exist(await store.get('key:db1'));
    should.not.exist(await client.get('key:db1'));
    await store.quit();
  });

  it('should set with ttl ok', async () => {
    const store = new RedisStore();
    store.client.ttl = promisify(store.client.ttl).bind(store.client);

    await store.set('key:ttl', { a: 1 }, 86400000);
    (await store.get('key:ttl')).should.eql({ a: 1 });
    (await store.client.ttl('key:ttl')).should.eql(86400);
    await store.quit();
  });

  it('should set without ttl ok', async () => {
    const store = new RedisStore();
    store.client.ttl = promisify(store.client.ttl).bind(store.client);
    await store.set('key:nottl', { a: 1 });
    (await store.get('key:nottl')).should.eql({ a: 1 });
    (await store.client.ttl('key:nottl')).should.eql(-1);
    await store.quit();
  });

  it('should expire after 1s', async () => {
    const sleep = t => new Promise(resolve => setTimeout(resolve, t));

    const store = new RedisStore();
    await store.set('key:ttl2', { a: 1, b: 2 }, 1000);
    await sleep(1000);
    should.not.exist(await store.get('key:ttl2'));
    await store.quit();
  });

  it('should not throw error with bad JSON', async () => {
    const store = new RedisStore();
    await store.client.set('key:badKey', '{I will cause an error!}');
    should.not.exist(await store.get('key:badKey'));
    await store.quit();
  });

  it('should use default JSON.parse/JSON.stringify without serialize/unserialize function', async () => {
    const store = new RedisStore({
      serialize: 'Not a function',
      unserialize: 'Not a function',
    });

    await store.set('key:notserialized', { a: 1 });
    (await store.get('key:notserialized')).should.eql({ a: 1 });
    await store.quit();
  });

  it('should use custom serialize/unserialize functions', async () => {
    const store = new RedisStore({
      serialize: data => JSON.stringify(data.a),
      unserialize: data => JSON.parse(data).c,
    });

    await store.set('key:custom', { a: { b: 1, c: 2 } });
    (await store.get('key:custom')).should.eql(2);
    await store.quit();
  });

  it('should parse bad JSON with custom unserialize function', async () => {
    const store = new RedisStore({
      serialize: data => `JSON:${JSON.stringify(data)}`,
      unserialize: data => JSON.parse(data.slice(5)),
    });
    await store.set('key:notserialized', { a: 1 });
    (await store.get('key:notserialized')).should.eql({ a: 1 });
    await store.quit();
  });
});
