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
  costPrice: number      // agorot (int)
  sellingPrice: number   // agorot (int)
  compareAtPrice: number // agorot (int), 0 = no strikethrough
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

export interface IProduct extends Document {
  slug: string
  nameHe: string
  nameEn: string
  descriptionHe: string
  images: IImage[]
  category: mongoose.Types.ObjectId
  tags: string[]
  pricing: IPricing
  inventory: IInventory
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
    slug: { type: String, required: true, unique: true },
    nameHe: { type: String, required: true },
    nameEn: { type: String, default: '' },
    descriptionHe: { type: String, default: '' },
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

ProductSchema.index({ slug: 1 }, { unique: true })
ProductSchema.index({ status: 1, featured: -1, createdAt: -1 })
ProductSchema.index({ category: 1 })
ProductSchema.index({ nameHe: 'text', descriptionHe: 'text' })

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
export default Product
