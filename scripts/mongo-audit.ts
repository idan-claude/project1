import mongoose from 'mongoose'
import { resolve } from 'path'
import { readFileSync } from 'fs'

try {
  const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
  }
} catch { /* no .env.local */ }

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1) }

async function main() {
  await mongoose.connect(MONGODB_URI!)
  console.log('✅ Connected to MongoDB Atlas\n')

  const db = mongoose.connection.db!

  // ── 1. ALL ORDERS ──────────────────────────────────────────────────────────
  const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray()
  console.log(`\n═══════════════════════════════════════`)
  console.log(`  ALL ORDERS IN MONGODB: ${orders.length}`)
  console.log(`═══════════════════════════════════════`)

  if (orders.length === 0) {
    console.log('  (none)')
  } else {
    for (const o of orders) {
      const email: string = o.customer?.email || '(none)'
      const masked = email.length > 4
        ? email.slice(0, 2) + '***' + email.slice(email.indexOf('@') > 0 ? email.indexOf('@') : -3)
        : '***'
      console.log(`\n  _id:            ${o._id}`)
      console.log(`  orderNumber:    ${o.orderNumber}`)
      console.log(`  createdAt:      ${o.createdAt}`)
      console.log(`  payment.status: ${o.payment?.status}`)
      console.log(`  order.status:   ${o.status}`)
      console.log(`  amount:         ₪${((o.pricing?.total ?? 0) / 100).toFixed(2)}`)
      console.log(`  method:         ${o.payment?.method}`)
      console.log(`  transactionId:  ${o.payment?.transactionId || '(none)'}`)
      console.log(`  testMode:       ${o.testMode ?? '(not set)'}`)
      console.log(`  customer:       ${masked}`)
    }
  }

  // ── 2. PAID ORDER COUNT (exact query analytics uses) ──────────────────────
  console.log(`\n═══════════════════════════════════════`)
  console.log(`  ANALYTICS QUERY RESULTS`)
  console.log(`═══════════════════════════════════════`)

  const paidAll = await db.collection('orders').countDocuments({ 'payment.status': 'paid' })
  const paidNoTest = await db.collection('orders').countDocuments({ 'payment.status': 'paid', testMode: { $ne: true } })
  const paidLast30 = await db.collection('orders').countDocuments({
    'payment.status': 'paid',
    testMode: { $ne: true },
    createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
  })

  console.log(`  paid (no filter):                ${paidAll}`)
  console.log(`  paid + testMode:{$ne:true}:      ${paidNoTest}`)
  console.log(`  paid + testMode + last30d:       ${paidLast30}`)

  // ── 3. REVENUE AGGREGATION (exact analytics query) ────────────────────────
  const revResult = await db.collection('orders').aggregate([
    { $match: { 'payment.status': 'paid', testMode: { $ne: true } } },
    { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' }, totalOrders: { $sum: 1 } } },
  ]).toArray()
  console.log(`  revenue aggregation result:      ${JSON.stringify(revResult[0] ?? { totalRevenue: 0, totalOrders: 0 })}`)

  // ── 4. VISITOR EVENTS ─────────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`)
  console.log(`  VISITOR EVENTS SUMMARY`)
  console.log(`═══════════════════════════════════════`)

  const eventCounts = await db.collection('visitorevents').aggregate([
    { $group: { _id: '$event', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray()

  if (eventCounts.length === 0) {
    console.log('  (no visitor events)')
  } else {
    for (const e of eventCounts) {
      console.log(`  ${String(e._id).padEnd(25)} ${e.count}`)
    }
  }

  const checkoutCompleteEvents = await db.collection('visitorevents')
    .countDocuments({ event: 'checkout_complete' })
  console.log(`\n  checkout_complete events total:  ${checkoutCompleteEvents}`)

  // ── 5. COLLECTIONS IN DB ──────────────────────────────────────────────────
  console.log(`\n═══════════════════════════════════════`)
  console.log(`  ALL COLLECTIONS`)
  console.log(`═══════════════════════════════════════`)
  const collections = await db.listCollections().toArray()
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments()
    console.log(`  ${c.name.padEnd(30)} ${count} documents`)
  }

  await mongoose.disconnect()
  console.log('\n✅ Audit complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
