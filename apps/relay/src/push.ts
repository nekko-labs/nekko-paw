import http2 from 'node:http2';
import { createPrivateKey, sign as cryptoSign, type KeyObject } from 'node:crypto';

/**
 * Relay-side push sender. The relay is the one always-on piece, so it holds the
 * push credentials (server secrets) and sends a **content-free** notification to
 * a paired phone when its desktop signals a finished run while the phone is
 * offline. The relay never sees the (E2E-encrypted) conversation — only the
 * "a run finished" signal — so a generic body keeps the zero-knowledge property.
 *
 * APNs is implemented natively (HTTP/2 + ES256 JWT, no dependency). FCM is a
 * documented stub until a Google service account is configured.
 */

export interface PushPayload {
  title: string;
  body: string;
}

export interface PushSender {
  enabled: boolean;
  send(token: string, platform: 'ios' | 'android', payload: PushPayload): Promise<void>;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString('base64url');

/**
 * Build an APNs provider JWT (ES256), cached for ~50 min as Apple recommends.
 * Exported for unit testing. `nowSec` is injectable for deterministic tests.
 */
export function makeApnsJwt(opts: { keyP8: string; keyId: string; teamId: string }) {
  const key: KeyObject = createPrivateKey(opts.keyP8);
  let cached = '';
  let cachedAt = 0;
  return (nowSec: number = Math.floor(Date.now() / 1000)): string => {
    if (cached && nowSec - cachedAt < 3000) return cached;
    const header = b64url(JSON.stringify({ alg: 'ES256', kid: opts.keyId }));
    const payload = b64url(JSON.stringify({ iss: opts.teamId, iat: nowSec }));
    const sig = cryptoSign('sha256', Buffer.from(`${header}.${payload}`), { key, dsaEncoding: 'ieee-p1363' });
    cached = `${header}.${payload}.${b64url(sig)}`;
    cachedAt = nowSec;
    return cached;
  };
}

async function sendApns(
  host: string,
  jwt: string,
  bundleId: string,
  token: string,
  payload: PushPayload,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${host}`);
    client.on('error', reject);
    const body = JSON.stringify({ aps: { alert: { title: payload.title, body: payload.body }, sound: 'default' } });
    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${token}`,
      authorization: `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'content-type': 'application/json',
    });
    let status = 0;
    req.on('response', (h) => (status = Number(h[':status'])));
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      client.close();
      status >= 200 && status < 300 ? resolve() : reject(new Error(`APNs ${status}: ${data}`));
    });
    req.on('error', reject);
    req.end(body);
  });
}

export function createPushSender(env: NodeJS.ProcessEnv = process.env): PushSender {
  const keyP8 = env.APNS_KEY_P8;
  const keyId = env.APNS_KEY_ID;
  const teamId = env.APNS_TEAM_ID;
  const bundleId = env.APNS_BUNDLE_ID ?? 'dev.nekkolabs.openpaw';
  const apnsHost = env.APNS_PRODUCTION === '1' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  const apnsReady = !!(keyP8 && keyId && teamId);
  const apnsJwt = apnsReady ? makeApnsJwt({ keyP8: keyP8!, keyId: keyId!, teamId: teamId! }) : null;

  return {
    enabled: apnsReady,
    async send(token, platform, payload) {
      try {
        if (platform === 'ios') {
          if (!apnsJwt) return void console.log('[push] APNs not configured (set APNS_KEY_P8/APNS_KEY_ID/APNS_TEAM_ID)');
          await sendApns(apnsHost, apnsJwt(), bundleId, token, payload);
          console.log('[push] APNs sent');
        } else {
          // FCM HTTP v1 needs a Google service account (RS256 JWT → OAuth token).
          console.log('[push] FCM not configured yet (Android remote push TODO)');
        }
      } catch (e) {
        console.warn(`[push] send failed: ${(e as Error).message}`);
      }
    },
  };
}
