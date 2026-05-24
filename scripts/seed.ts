/**
 * Seed script — run once to populate initial categories and products.
 * Usage: npm run seed
 */
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker-store'

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const Category = (await import('../src/lib/db/models/Category')).default
  const Product = (await import('../src/lib/db/models/Product')).default

  // --- Categories ---
  const cats = [
    { nameHe: 'כרטיסי מעקב', slug: 'tracking-cards', sortOrder: 1 },
    { nameHe: 'מטענים אלחוטיים', slug: 'wireless-chargers', sortOrder: 2 },
    { nameHe: 'מכסי דרכון', slug: 'passport-covers', sortOrder: 3 },
    { nameHe: 'נרתיקי משקפיים', slug: 'glasses-cases', sortOrder: 4 },
    { nameHe: 'מנעולים חכמים', slug: 'smart-locks', sortOrder: 5 },
    { nameHe: 'חבילות', slug: 'bundles', sortOrder: 6 },
  ]

  for (const cat of cats) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true })
    console.log(`✓ Category: ${cat.nameHe}`)
  }

  const trackingCat = await Category.findOne({ slug: 'tracking-cards' })

  // --- Apple FindCard PRO ---
  const appleExisting = await Product.findOne({ slug: 'kartis-maakav-smart-pro' })
  if (!appleExisting) {
    await Product.create({
      slug: 'kartis-maakav-smart-pro',
      nameHe: 'כרטיס מעקב FindCard PRO',
      nameEn: 'FindCard PRO Tracking Card',
      descriptionHe: 'כרטיס מעקב חכם תואם Apple Find My. דק בדיוק 1.8מ"מ — נכנס לכל ארנק ומוצא את המפתחות, הארנק וכל דבר אחר תוך שניות.',
      images: [],
      category: trackingCat?._id,
      pricing: {
        sellingPrice: 16900,
        compareAtPrice: 24900,
        costPrice: 5500,
        vatIncluded: true,
      },
      inventory: { trackQuantity: false, quantity: 999, lowStockThreshold: 5 },
      status: 'active',
      featured: true,
      aliexpressData: {
        productId: '1005010258738438',
        sourceUrl: 'https://he.aliexpress.com/item/1005010258738438.html',
        lastSynced: new Date(),
      },
    })
    console.log('✓ Product: כרטיס מעקב FindCard PRO (Apple)')
  } else {
    console.log('— Apple product already exists')
  }

  // --- Bundle ---
  const bundleCat = await Category.findOne({ slug: 'bundles' })
  const bundleExisting = await Product.findOne({ slug: 'chavila-mishpachtit-3-kartisim' })
  if (!bundleExisting) {
    await Product.create({
      slug: 'chavila-mishpachtit-3-kartisim',
      nameHe: 'חבילה משפחתית — 3 כרטיסי מעקב',
      nameEn: 'Family Bundle - 3 Tracking Cards',
      descriptionHe: 'קנה 2 כרטיסי מעקב FindCard PRO וקבל אחד נוסף חינם! מושלם למשפחות. כל כרטיס תואם Apple Find My.',
      images: [],
      category: bundleCat?._id,
      pricing: {
        sellingPrice: 33800,
        compareAtPrice: 50700,
        costPrice: 16500,
        vatIncluded: true,
      },
      inventory: { trackQuantity: false, quantity: 999, lowStockThreshold: 5 },
      status: 'active',
      featured: true,
    })
    console.log('✓ Bundle: חבילה משפחתית')
  } else {
    console.log('— Bundle already exists')
  }

  await mongoose.disconnect()
  console.log('\n✅ Seed complete!')
}

main().catch((err) => { console.error(err); process.exit(1) })
