/**
 * AES-256-GCM encryption for credential storage.
 * SETTINGS_ENCRYPTION_KEY must be a 64-char hex string (32 bytes).
 * This key stays in ENV — it encrypts all other credentials in DB.
 *
 * Generate a key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import crypto from 'crypto'

const ALG = 'aes-256-gcm'
const IV_LEN = 12

function getKey(): Buffer {
  const hex = process.env.SETTINGS_ENCRYPTION_KEY
  if (!hex) {
    // Development fallback — stable but insecure. Production MUST set this key.
    return Buffer.from('0'.repeat(64), 'hex')
  }
  if (hex.length !== 64) {
    throw new Error('SETTINGS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALG, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv:tag:ciphertext — all base64
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':')
  if (parts.length !== 3) throw new Error('Invalid ciphertext format')
  const key = getKey()
  const iv = Buffer.from(parts[0], 'base64')
  const tag = Buffer.from(parts[1], 'base64')
  const data = Buffer.from(parts[2], 'base64')
  const decipher = crypto.createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data) + decipher.final('utf8')
}

/** Returns true if value looks like an encrypted ciphertext (iv:tag:ct format). */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.split(':').length === 3
}
