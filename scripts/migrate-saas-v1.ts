/**
 * SaaS Migration v1 — seeds the default Store and AdminUser
 * from the current ENV-based single-tenant setup.
 *
 * Run once: npx tsx scripts/migrate-saas-v1.ts
 *
 * Safe to re-run (upsert semantics, no data loss).
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Inline minimal schemas to avoid import chain
const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  emailVerified: { type: Boolean, default: false },
  status: { type: String, default: 'active' },
}, { timestamps: true })

const StoreSchema = new mongoose.Schema({
  storeId: { type: String, required: true, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  subdomain: { type: String, default: '' },
  status: { type: String, default: 'active' },
  plan: { type: String, default: 'free' },
  settings: {
    currency: { type: String, default: 'ILS' },
    language: { type: String, default: 'he' },
    timezone: { type: String, default: 'Asia/Jerusalem' },
  },
}, { timestamps: true })

const StoreMemberSchema = new mongoose.Schema({
  storeId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  role: { type: String, required: true },
  status: { type: String, default: 'active' },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true })

StoreMemberSchema.index({ storeId: 1, userId: 1 }, { unique: true })

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema)
const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema)
const StoreMember = mongoose.models.StoreMember || mongoose.model('StoreMember', StoreMemberSchema)

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI not set')

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')

  await mongoose.connect(uri)
  console.log('✓ Connected to MongoDB')

  // 1. Upsert AdminUser
  let adminUser = await AdminUser.findOne({ email: adminEmail.toLowerCase() })
  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    adminUser = await AdminUser.create({
      email: adminEmail.toLowerCase(),
      passwordHash,
      name: 'Admin',
      status: 'active',
      emailVerified: true,
    })
    console.log(`✓ Created AdminUser: ${adminEmail}`)
  } else {
    console.log(`  AdminUser already exists: ${adminEmail}`)
  }

  // 2. Upsert default Store
  let store = await Store.findOne({ storeId: 'default' })
  if (!store) {
    store = await Store.create({
      storeId: 'default',
      ownerId: adminUser._id,
      name: 'FindCard Store',
      slug: 'default',
      subdomain: 'default',
      status: 'active',
      plan: 'free',
    })
    console.log('✓ Created default Store')
  } else {
    // Update ownerId if not set
    if (!store.ownerId) {
      await Store.updateOne({ storeId: 'default' }, { ownerId: adminUser._id })
      console.log('  Updated default Store ownerId')
    } else {
      console.log('  Default Store already exists')
    }
  }

  // 3. Upsert StoreMember (owner)
  const existing = await StoreMember.findOne({ storeId: 'default', userId: adminUser._id })
  if (!existing) {
    await StoreMember.create({
      storeId: 'default',
      userId: adminUser._id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    })
    console.log('✓ Created StoreMember (owner)')
  } else {
    console.log('  StoreMember already exists')
  }

  console.log('\n✅ Migration complete. Platform is SaaS-ready.')
  console.log('   Default store storeId: "default"')
  console.log(`   Admin: ${adminEmail}`)
  console.log('\n   Next: Re-login to get a new JWT with storeId embedded.\n')
  await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })
