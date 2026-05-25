import mongoose, { Schema, Document, Model } from 'mongoose'

interface IVariantOption {
  label: string
  priceModifier: number
  stock: number
  sku: string
}

interface IVariant {
  name: string
  options: IVariantOption[]
}

interface IImage {
  url: string
  alt: string
}

interface IPricing {
  costPrice: number
  sellingPrice: number
  compareAtPrice: number
  vatIncluded: boolean
}

interface IInventory {
  trackQuantity: boolean
  quantity: number
  lowStockThreshold: number
}

interface IAliexpressData {
  productId: string
  sourceUrl: string
  lastSynced: Date
}

interface ISeo {
  metaTitle: string
  metaDescription: string
}

export interface IBundle {
  title: string
  quantity: number
  price: number           // agorot, exact — admin sets this, no rounding applied
  compareAtPrice: number  // agorot, exact
  badge: string
  badgeColor: string
  isRecommended: boolean
  benefits: string[]
  imageOverride: string
  active: boolean
}

interface IPageFeature {
  icon: string
  label: string
  desc: string
}

interface IPageFaq {
  q: string
  a: string
}

export interface IPageContent {
  features: IPageFeature[]
  faqs: IPageFaq[]
  urgencyText: string
  shippingText: string
  guaranteeText: string
  reviewRating: number
  reviewCount: number
  trustBadges: { icon: string; text: string }[]
}

export interface IProduct extends Document {
  storeId: string
  slug: string
  nameHe: string
  nameEn: string
  subtitle: string
  descriptionHe: string
  descriptionShort: string
  benefitsList: string[]
  ctaText: string
  addToCartText: string
  videoUrl: string
  ogImage: string
  scheduledAt: Date | null
  beforeAfter: { before: string; after: string; label: string }[]
  images: IImage[]
  category: mongoose.Types.ObjectId
  tags: string[]
  pricing: IPricing
  inventory: IInventory
  bundles: IBundle[]
  pageContent: IPageContent
  variants: IVariant[]
  sku: string
  status: 'active' | 'draft' | 'archived'
  aliexpressData: IAliexpressData
  seo: ISeo
  featured: boolean
  weight: number
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    storeId: { type: String, default: 'default', index: true },
    slug: { type: String, required: true, unique: true },
    nameHe: { type: String, required: true },
    nameEn: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    descriptionHe: { type: String, default: '' },
    descriptionShort: { type: String, default: '' },
    benefitsList: [String],
    ctaText: { type: String, default: '' },
    addToCartText: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    scheduledAt: { type: Date, default: null },
    beforeAfter: [{ before: String, after: String, label: { type: String, default: '' } }],
    images: [{ url: String, alt: { type: String, default: '' } }],
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    tags: [String],
    pricing: {
      costPrice: { type: Number, default: 0 },
      sellingPrice: { type: Number, required: true },
      compareAtPrice: { type: Number, default: 0 },
      vatIncluded: { type: Boolean, default: true },
    },
    inventory: {
      trackQuantity: { type: Boolean, default: true },
      quantity: { type: Number, default: 0 },
      lowStockThreshold: { type: Number, default: 5 },
    },
    bundles: [
      {
        title: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true },
        compareAtPrice: { type: Number, default: 0 },
        badge: { type: String, default: '' },
        badgeColor: { type: String, default: 'bg-blue-600' },
        isRecommended: { type: Boolean, default: false },
        benefits: [String],
        imageOverride: { type: String, default: '' },
        active: { type: Boolean, default: true },
      },
    ],
    pageContent: {
      features: [
        {
          icon: { type: String, default: '' },
          label: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
      ],
      faqs: [
        {
          q: { type: String, default: '' },
          a: { type: String, default: '' },
        },
      ],
      urgencyText: { type: String, default: '' },
      shippingText: { type: String, default: '' },
      guaranteeText: { type: String, default: '' },
      reviewRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      trustBadges: [
        {
          icon: { type: String, default: '' },
          text: { type: String, default: '' },
        },
      ],
    },
    variants: [
      {
        name: String,
        options: [
          {
            label: String,
            priceModifier: { type: Number, default: 0 },
            stock: { type: Number, default: 0 },
            sku: { type: String, default: '' },
          },
        ],
      },
    ],
    sku: { type: String, default: '' },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'draft' },
    aliexpressData: {
      productId: { type: String, default: '' },
      sourceUrl: { type: String, default: '' },
      lastSynced: Date,
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
    },
    featured: { type: Boolean, default: false },
    weight: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ProductSchema.index({ status: 1, featured: -1, createdAt: -1 })
ProductSchema.index({ category: 1 })
ProductSchema.index({ nameHe: 'text', descriptionHe: 'text' })

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
export default Product
