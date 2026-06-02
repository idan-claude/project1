/**
 * CredentialStore — DB-first credential management with ENV fallback.
 *
 * Pattern:
 *   1. Try Settings DB for the given (storeId, service)
 *   2. Fall back to process.env (backward compat / first-run)
 *
 * Sensitive fields (marked with * below) are encrypted at rest.
 * All other fields are stored as plain text in the JSON value.
 */
import { connectDB } from '@/lib/db/mongoose'
import Settings from '@/lib/db/models/Settings'
import { encrypt, decrypt, isEncrypted } from './encrypt'

// ─── Config type definitions ─────────────────────────────────────────────────

export interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string        // * encrypted
  adminEmail: string
  fromName: string
}

export interface TwilioConfig {
  accountSid: string
  authToken: string   // * encrypted
  fromNumber: string
  adminNumber: string
}

export interface MetaConfig {
  pixelId: string
  capiToken: string   // * encrypted
  testCode: string
}

export interface TikTokConfig {
  pixelId: string
  eventsApiToken: string  // * encrypted
}

export interface CardcomConfig {
  terminal: string
  username: string
  password: string  // * encrypted
  testMode: boolean
}

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string  // * encrypted
}

export interface AliExpressConfig {
  appKey: string
  appSecret: string  // * encrypted
}

export interface Ga4Config {
  measurementId: string
  apiSecret: string  // * encrypted — Measurement Protocol API Secret
}

// ─── Sensitive field definitions per service ─────────────────────────────────

const SENSITIVE: Record<string, string[]> = {
  smtp:       ['pass'],
  twilio:     ['authToken'],
  meta:       ['capiToken'],
  tiktok:     ['eventsApiToken'],
  cardcom:    ['password'],
  cloudinary: ['apiSecret'],
  aliexpress: ['appSecret'],
  ga4:        ['apiSecret'],
}

// ─── Core read/write ─────────────────────────────────────────────────────────

async function readFromDB<T>(storeId: string, service: string): Promise<T | null> {
  await connectDB()
  const doc = await Settings.findOne({ storeId, key: `integration:${service}` }).lean()
  if (!doc?.value || typeof doc.value !== 'object') return null
  const raw = doc.value as Record<string, unknown>
  const sensitiveFields = SENSITIVE[service] ?? []
  const decrypted: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (sensitiveFields.includes(k) && typeof v === 'string' && isEncrypted(v)) {
      try { decrypted[k] = decrypt(v) } catch { decrypted[k] = '' }
    } else {
      decrypted[k] = v
    }
  }
  return decrypted as T
}

export async function saveCredentials<T extends Record<string, unknown>>(
  storeId: string,
  service: string,
  config: T
): Promise<void> {
  await connectDB()
  const sensitiveFields = SENSITIVE[service] ?? []
  const toStore: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(config)) {
    if (sensitiveFields.includes(k) && typeof v === 'string' && v) {
      toStore[k] = encrypt(v)
    } else {
      toStore[k] = v
    }
  }
  await Settings.findOneAndUpdate(
    { storeId, key: `integration:${service}` },
    { storeId, key: `integration:${service}`, value: toStore },
    { upsert: true }
  )
}

export async function deleteCredentials(storeId: string, service: string): Promise<void> {
  await connectDB()
  await Settings.deleteOne({ storeId, key: `integration:${service}` })
}

// ─── Per-service getters with ENV fallback ────────────────────────────────────

export async function getSmtpConfig(storeId = 'default'): Promise<SmtpConfig | null> {
  const db = await readFromDB<SmtpConfig>(storeId, 'smtp')
  if (db?.user && db?.pass) return db

  // ENV fallback
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  if (!user || !pass) return null
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user,
    pass,
    adminEmail: process.env.ADMIN_EMAIL_TO || user,
    fromName: 'FindCard',
  }
}

export async function getTwilioConfig(storeId = 'default'): Promise<TwilioConfig | null> {
  const db = await readFromDB<TwilioConfig>(storeId, 'twilio')
  if (db?.accountSid && db?.authToken) return db

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_SMS_FROM || ''
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || ''
  if (!accountSid || !authToken) return null
  return { accountSid, authToken, fromNumber, adminNumber }
}

export async function getMetaConfig(storeId = 'default'): Promise<MetaConfig | null> {
  const db = await readFromDB<MetaConfig>(storeId, 'meta')
  if (db?.pixelId) return db

  const pixelId  = process.env.META_PIXEL_ID || ''
  const capiToken = process.env.META_CAPI_TOKEN || ''
  if (!pixelId) return null
  return { pixelId, capiToken, testCode: process.env.META_CAPI_TEST_CODE || '' }
}

export async function getTikTokConfig(storeId = 'default'): Promise<TikTokConfig | null> {
  const db = await readFromDB<TikTokConfig>(storeId, 'tiktok')
  if (db?.pixelId) return db

  const pixelId = process.env.TIKTOK_PIXEL_ID || ''
  if (!pixelId) return null
  return { pixelId, eventsApiToken: process.env.TIKTOK_EVENTS_API_TOKEN || '' }
}

export async function getCardcomConfig(storeId = 'default'): Promise<CardcomConfig | null> {
  const db = await readFromDB<CardcomConfig>(storeId, 'cardcom')
  if (db?.terminal && db?.username && db?.password) return db

  const terminal = process.env.CARDCOM_TERMINAL_NUMBER || ''
  const username = process.env.CARDCOM_API_USERNAME || ''
  const password = process.env.CARDCOM_API_PASSWORD || ''
  if (!terminal || !username || !password) return null
  return { terminal, username, password, testMode: process.env.PAYMENT_TEST_MODE === 'true' }
}

export async function getCloudinaryConfig(storeId = 'default'): Promise<CloudinaryConfig | null> {
  const db = await readFromDB<CloudinaryConfig>(storeId, 'cloudinary')
  if (db?.cloudName && db?.apiKey && db?.apiSecret) return db

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || ''
  const apiKey    = process.env.CLOUDINARY_API_KEY || ''
  const apiSecret = process.env.CLOUDINARY_API_SECRET || ''
  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

export async function getAliExpressConfig(storeId = 'default'): Promise<AliExpressConfig | null> {
  const db = await readFromDB<AliExpressConfig>(storeId, 'aliexpress')
  if (db?.appKey && db?.appSecret) return db

  const appKey = process.env.ALIEXPRESS_APP_KEY || ''
  const appSecret = process.env.ALIEXPRESS_APP_SECRET || ''
  if (!appKey || !appSecret) return null
  return { appKey, appSecret }
}

export async function getGa4Config(storeId = 'default'): Promise<Ga4Config | null> {
  const db = await readFromDB<Ga4Config>(storeId, 'ga4')
  if (db?.measurementId) return db

  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ''
  if (!measurementId) return null
  return { measurementId, apiSecret: process.env.GA4_API_SECRET || '' }
}
