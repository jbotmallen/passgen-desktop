// Cryptographically secure random helpers for password generation.
// Uses Web Crypto's getRandomValues with rejection sampling to remove modulo bias.

const MAX_U32 = 0x100000000;

export function secureIntBelow(n: number): number {
  if (!Number.isInteger(n) || n <= 0 || n > MAX_U32) {
    throw new Error('secureIntBelow: bound must be a positive integer <= 2^32');
  }
  const limit = Math.floor(MAX_U32 / n) * n;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % n;
  }
}

export function secureRangeInclusive(min: number, max: number): number {
  if (max < min) throw new Error('secureRangeInclusive: max < min');
  return min + secureIntBelow(max - min + 1);
}

export function securePick<T>(arr: ArrayLike<T>): T {
  if (arr.length === 0) throw new Error('securePick: empty array');
  return arr[secureIntBelow(arr.length)];
}

export function securePickFromString(s: string): string {
  return s.charAt(secureIntBelow(s.length));
}

export function secureShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureIntBelow(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function secureBool(): boolean {
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] & 1) === 1;
}

export function secureChance(probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / MAX_U32 < probability;
}
