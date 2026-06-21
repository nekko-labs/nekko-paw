import { describe, it, expect } from 'vitest';
import { generateKeyPairSync, verify as cryptoVerify } from 'node:crypto';
import { makeApnsJwt } from './push.js';

const ecKeyP8 = () =>
  generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

describe('makeApnsJwt', () => {
  it('produces a verifiable ES256 JWT with the right header + claims', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const keyP8 = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const jwt = makeApnsJwt({ keyP8, keyId: 'ABC123', teamId: 'TEAM456' })(1000);

    const [h, p, s] = jwt.split('.');
    expect(JSON.parse(Buffer.from(h, 'base64url').toString())).toEqual({ alg: 'ES256', kid: 'ABC123' });
    expect(JSON.parse(Buffer.from(p, 'base64url').toString())).toEqual({ iss: 'TEAM456', iat: 1000 });

    const ok = cryptoVerify(
      'sha256',
      Buffer.from(`${h}.${p}`),
      { key: publicKey, dsaEncoding: 'ieee-p1363' },
      Buffer.from(s, 'base64url'),
    );
    expect(ok).toBe(true);
  });

  it('caches within ~50 min and refreshes after', () => {
    const jwt = makeApnsJwt({ keyP8: ecKeyP8(), keyId: 'k', teamId: 't' });
    expect(jwt(1000)).toBe(jwt(2000)); // cached (<3000s)
    expect(jwt(1000)).not.toBe(jwt(5000)); // refreshed past the window
  });
});
