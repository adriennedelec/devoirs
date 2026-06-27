import { describe, expect, it } from 'vitest';
import { hashLegacyHexPasswordForStorage, hashPasswordForStorage, sha256Hex } from '../src/services/passwordHash';

describe('passwordHash', () => {
  it('hashes passwords with real SHA-256 hex output', () => {
    expect(sha256Hex('secret123')).toBe('fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4');
    expect(hashPasswordForStorage('secretmulti')).toBe('sha256:ffe5431cfab2ebd92727953036bed9c0d869f597520fe18acf65c120bd968905');
  });

  it('keeps legacy hex pseudo-hash available only for matching old stored users', () => {
    expect(hashLegacyHexPasswordForStorage('secretmulti')).toBe('sha256:7365637265746d756c7469');
  });
});
