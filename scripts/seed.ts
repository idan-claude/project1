/**
 * Seed script — run once to populate initial categories and a sample product.
 * Usage: npx tsx scripts/seed.ts
 */
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker-store'

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  // Dynamic imports after connection
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

  // --- Sample product ---
  const existing = await Product.findOne({ slug: 'kartis-maakav-smart-pro' })
  if (!existing) {
    await Product.create({
      slug: 'kartis-maakav-smart-pro',
      nameHe: 'כרטיס מעקב Smart PRO',
      nameEn: 'Smart PRO Tracking Card',
      descriptionHe: 'כרטיס מעקב חכם תואם Apple Find My. דק כמו כרטיס אשראי, נכנס לכל ארנק. גלה את מיקום הארנק שלך בשניות דרך אפליקציית Find My. סוללה נטענת אלחוטית עם עמידות של עד 6 חודשים.',
      images: [
        { url: 'https://via.placeholder.com/600x600/2563EB/FFFFFF?text=TrackIT+PRO', alt: 'כרטיס מעקב Smart PRO' },
      ],
      category: trackingCat?._id,
      pricing: {
        sellingPrice: 16900,  // ₪169
        compareAtPrice: 24900, // ₪249
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
    console.log('✓ Sample product: כרטיס מעקב Smart PRO')
  } else {
    console.log('— Sample product already exists')
  }

  // --- Bundle product ---
  const bundleCat = await Category.findOne({ slug: 'bundles' })
  const bundleExisting = await Product.findOne({ slug: 'chavila-mishpachtit-3-kartisim' })
  if (!bundleExisting) {
    await Product.create({
      slug: 'chavila-mishpachtit-3-kartisim',
      nameHe: 'חבילה משפחתית — 3 כרטיסי מעקב',
      nameEn: 'Family Bundle - 3 Tracking Cards',
      descriptionHe: 'קנה 2 כרטיסי מעקב Smart PRO וקבל אחד נוסף חינם! מושלם למשפחות. כל כרטיס תואם Apple Find My.',
      images: [
        { url: 'https://via.placeholder.com/600x600/1D4ED8/FFFFFF?text=Family+Bundle', alt: 'חבילה משפחתית' },
      ],
      category: bundleCat?._id,
      pricing: {
        sellingPrice: 33800,  // ₪338
        compareAtPrice: 50700, // ₪507
        costPrice: 16500,
        vatIncluded: true,
      },
      inventory: { trackQuantity: false, quantity: 999, lowStockThreshold: 5 },
      status: 'active',
      featured: true,
    })
    console.log('✓ Bundle product: חבילה משפחתית')
  }

  await mongoose.disconnect()
  console.log('\n✅ Seed complete!')
}

main().catch((err) => { console.error(err); process.exit(1) })
