import mongoose, { Schema, Document, Model } from 'mongoose'

export type SectionType =
  | 'hero'
  | 'benefits'
  | 'bundles'
  | 'urgency'
  | 'trust'
  | 'guarantee'
  | 'shipping'
  | 'reviews'
  | 'faq'
  | 'video'
  | 'before_after'
  | 'custom_text'

export interface ISection {
  type: SectionType
  enabled: boolean
  order: number
  config: Record<string, unknown>
}

export interface IPageLayout extends Document {
  storeId: string
  productId: mongoose.Types.ObjectId | null
  sections: ISection[]
  updatedAt: Date
}

export const DEFAULT_SECTIONS: ISection[] = [
  { type: 'hero',        enabled: true,  order: 0,  config: {} },
  { type: 'urgency',     enabled: true,  order: 1,  config: {} },
  { type: 'bundles',     enabled: true,  order: 2,  config: {} },
  { type: 'trust',       enabled: true,  order: 3,  config: {} },
  { type: 'guarantee',   enabled: true,  order: 4,  config: {} },
  { type: 'shipping',    enabled: true,  order: 5,  config: {} },
  { type: 'benefits',    enabled: true,  order: 6,  config: {} },
  { type: 'reviews',     enabled: true,  order: 7,  config: {} },
  { type: 'faq',         enabled: true,  order: 8,  config: {} },
  { type: 'video',       enabled: false, order: 9,  config: {} },
  { type: 'before_after',enabled: false, order: 10, config: {} },
  { type: 'custom_text', enabled: false, order: 11, config: { html: '' } },
]

const SectionSchema = new Schema<ISection>(
  {
    type: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
)

const PageLayoutSchema = new Schema<IPageLayout>(
  {
    storeId: { type: String, default: 'default', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    sections: [SectionSchema],
  },
  { timestamps: { createdAt: false, updatedAt: true } }
)

PageLayoutSchema.index({ storeId: 1, productId: 1 }, { unique: true, sparse: true })

const PageLayout: Model<IPageLayout> =
  mongoose.models.PageLayout || mongoose.model<IPageLayout>('PageLayout', PageLayoutSchema)
export default PageLayout
