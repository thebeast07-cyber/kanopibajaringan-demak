import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alamatDariEnv } from './redis';

test('alamat REST dibaca dari pasangan KV_REST_API_* atau UPSTASH_REDIS_REST_*', () => {
  assert.deepEqual(alamatDariEnv({ KV_REST_API_URL: 'https://a.upstash.io', KV_REST_API_TOKEN: 't' }), {
    url: 'https://a.upstash.io',
    token: 't',
  });
  assert.deepEqual(alamatDariEnv({ UPSTASH_REDIS_REST_URL: 'https://b.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'u' }), {
    url: 'https://b.upstash.io',
    token: 'u',
  });
});

test('alamat REST diturunkan dari rediss:// Upstash kalau cuma itu yang ada', () => {
  assert.deepEqual(alamatDariEnv({ KV_URL: 'rediss://default:AbC%3D123@hebat-kanopi-1234.upstash.io:6379' }), {
    url: 'https://hebat-kanopi-1234.upstash.io',
    token: 'AbC=123',
  });
  assert.deepEqual(alamatDariEnv({ REDIS_URL: 'rediss://default:x@c.upstash.io:6379' }), { url: 'https://c.upstash.io', token: 'x' });
});

test('tanpa Redis, atau Redis bukan Upstash: dianggap belum dipasang', () => {
  assert.equal(alamatDariEnv({}), null);
  assert.equal(alamatDariEnv({ REDIS_URL: 'redis://localhost:6379' }), null);
  assert.equal(alamatDariEnv({ KV_URL: 'bukan url' }), null);
});
