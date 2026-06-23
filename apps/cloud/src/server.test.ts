import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { createCloudServer } from './server.js';

/** Drives the real cloud server over Fastify `inject` — no network, no model. */
describe('cloud server (HTTP)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ app } = createCloudServer({ dataRoot: mkdtempSync(join(tmpdir(), 'op-cloudsrv-')) }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  const signup = async (email: string, password = 'longenough') => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/signup', payload: { email, password } });
    return res.json() as { token: string; account: { id: string }; entitlements: { maxWorkspaces: number } };
  };
  const call = (token: string, channel: string, args: unknown[] = []) =>
    app.inject({ method: 'POST', url: `/api/${channel}`, headers: { authorization: `Bearer ${token}` }, payload: { args } });

  it('advertises cloud mode', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/config' });
    expect(res.json()).toEqual({ cloud: true });
  });

  it('rejects unauthenticated NekkoApi calls', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/settings:get', payload: { args: [] } });
    expect(res.statusCode).toBe(401);
  });

  it('signup → authed dispatch reaches the per-account host', async () => {
    const { token, account } = await signup('alice@example.com');
    expect(account.id).toBeTruthy();
    const res = await call(token, 'settings:get');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('providers'); // real settings from the account's host
  });

  it('isolates data between accounts', async () => {
    const a = await signup('a@example.com');
    const b = await signup('b@example.com');
    const dir = mkdtempSync(join(tmpdir(), 'op-ws-'));
    await call(a.token, 'workspace:addByPath', [dir]);
    expect((await call(a.token, 'workspace:list')).json()).toHaveLength(1);
    expect((await call(b.token, 'workspace:list')).json()).toHaveLength(0); // B can't see A's workspace
  });

  it('enforces the free-plan workspace limit (server-side)', async () => {
    const { token } = await signup('c@example.com');
    await call(token, 'workspace:addByPath', [mkdtempSync(join(tmpdir(), 'op-ws-'))]);
    await call(token, 'workspace:addByPath', [mkdtempSync(join(tmpdir(), 'op-ws-'))]);
    const third = await call(token, 'workspace:addByPath', [mkdtempSync(join(tmpdir(), 'op-ws-'))]);
    expect(third.statusCode).toBe(400);
    expect(third.json().error).toMatch(/upgrade/i);
    expect((await call(token, 'workspace:list')).json()).toHaveLength(2);
  });
});
