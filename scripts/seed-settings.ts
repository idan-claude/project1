import mongoose from 'mongoose'

async function main() {
  await mongoose.connect('mongodb://localhost:27017/tracker-store')
  const Settings = (await import('../src/lib/db/models/Settings')).default
  await Settings.findOneAndUpdate(
    { key: 'store' },
    { key: 'store', value: { storeName: 'FindCard', storeEmail: 'findcardsupport@gmail.com', storePhone: '', storeAddress: '', storeCity: '' } },
    { upsert: true }
  )
  console.log('✓ Store settings saved')
  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
