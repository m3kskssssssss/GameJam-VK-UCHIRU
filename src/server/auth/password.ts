// bcryptjs helpers — never log or return raw passwords or hashes
import bcrypt from 'bcryptjs'

const COST_FACTOR = 10

/**
 * Hash a plaintext password. Use this when creating or updating credentials.
 * Never store or log the returned hash alongside the plaintext.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, COST_FACTOR)
}

/**
 * Compare a plaintext password candidate against a stored bcrypt hash.
 * Returns true only if they match.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash)
}
