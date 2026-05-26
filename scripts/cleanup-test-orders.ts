/**
 * One-time cleanup: inspect and optionally delete Cardcom sandbox/test paid orders.
 *
 * Usage:
 *   npx ts-node -r dotenv/config scripts/cleanup-test-orders.ts          # dry-run: shows orders
 *   npx ts-node -r dotenv/config scripts/cleanup-test-orders.ts --delete  # deletes them
 *
 * Requires MONGODB_URI in .env.local
 */
import mongoose from 'mongoose'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load .env.local manually without dotenv dependency
try {
  const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
  }
} catch { /* .env.local not present */ }

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set in .env.local'); process.exit(1) }

const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  customer: { name: String, email: String },
  pricing: { total: Number },
  payment: { status: String, transactionId: String, paidAt: Date },
  testMode: Boolean,
  createdAt: Date,
}, { timestamps: true })

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema)

async function main() {
  const shouldDelete = process.argv.includes('--delete')

  await mongoose.connect(MONGODB_URI!)
  console.log('✅ Connected to MongoDB Atlas\n')

  const paidOrders = await Order.find({ 'payment.status': 'paid' })
    .select('orderNumber customer.name customer.email pricing.total payment.transactionId payment.paidAt testMode createdAt')
    .sort({ createdAt: -1 })
    .lean()

  console.log(`📋 Found ${paidOrders.length} paid order(s) in MongoDB:\n`)

  if (paidOrders.length === 0) {
    console.log('✅ No paid orders found — database is clean.')
    await mongoose.disconnect()
    return
  }

  for (const o of paidOrders as Record<string, unknown>[]) {
    const pricing = o.pricing as { total: number }
    const payment = o.payment as { transactionId: string; paidAt?: Date }
    const customer = o.customer as { name: string; email: string }
    console.log(`  Order: ${o.orderNumber}`)
    console.log(`    Customer:  ${customer.name} <${customer.email}>`)
    console.log(`    Amount:    ₪${(pricing.total / 100).toFixed(2)}`)
    console.log(`    TxID:      ${payment.transactionId || '(none)'}`)
    console.log(`    Paid at:   ${payment.paidAt || '(not set)'}`)
    console.log(`    testMode:  ${o.testMode ?? false}`)
    console.log(`    Created:   ${o.createdAt}\n`)
  }

  if (!shouldDelete) {
    console.log('ℹ️  DRY RUN — no changes made.')
    console.log('   To delete ALL paid orders: run with --delete flag')
    console.log('   ⚠️  Only run --delete if ALL shown orders are sandbox/test transactions!\n')
  } else {
    console.log('🗑️  Deleting all paid orders...')
    const result = await Order.deleteMany({ 'payment.status': 'paid' })
    console.log(`✅ Deleted ${result.deletedCount} paid order(s).`)
    console.log('   Analytics will now show: 0 purchases, ₪0 revenue, 0% conversion.\n')
  }

  await mongoose.disconnect()
  console.log('Disconnected from MongoDB.')
}

main().catch(err => { console.error(err); process.exit(1) })
