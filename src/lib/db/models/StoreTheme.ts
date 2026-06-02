import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDesignTokens {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  textSecondary: string
  borderColor: string
  buttonRadius: string
  cardRadius: string
  fontFamily: string
  fontSize: string
  spacing: string
}

export interface IStoreTheme extends Document {
  storeId: string
  name: string
  tokens: IDesignTokens
  logoUrl: string
  faviconUrl: string
  heroImageUrl: string
  sections: Array<{
    id: string
    type: string
    enabled: boolean
    order: number
    settings: Record<string, unknown>
  }>
  customCss: string
  status: 'draft' | 'published'
  publishedAt: Date | null
  version: number
  createdAt: Date
  updatedAt: Date
}

const DesignTokensSchema = new Schema<IDesignTokens>(
  {
    primaryColor:    { type: String, default: '#3b82f6' },
    secondaryColor:  { type: String, default: '#1e40af' },
    accentColor:     { type: String, default: '#f59e0b' },
    backgroundColor: { type: String, default: '#ffffff' },
    surfaceColor:    { type: String, default: '#f8fafc' },
    textColor:       { type: String, default: '#0f172a' },
    textSecondary:   { type: String, default: '#64748b' },
    borderColor:     { type: String, default: '#e2e8f0' },
    buttonRadius:    { type: String, default: '0.75rem' },
    cardRadius:      { type: String, default: '1rem' },
    fontFamily:      { type: String, default: 'Rubik' },
    fontSize:        { type: String, default: '16px' },
    spacing:         { type: String, default: 'comfortable' },
  },
  { _id: false }
)

const SectionSettingsSchema = new Schema(
  {
    id:       { type: String, required: true },
    type:     { type: String, required: true },
    enabled:  { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
)

const StoreThemeSchema = new Schema<IStoreTheme>(
  {
    storeId:      { type: String, required: true, index: true },
    name:         { type: String, default: 'ערכת ברירת מחדל' },
    tokens:       { type: DesignTokensSchema, default: () => ({}) },
    logoUrl:      { type: String, default: '' },
    faviconUrl:   { type: String, default: '' },
    heroImageUrl: { type: String, default: '' },
    sections:     [SectionSettingsSchema],
    customCss:    { type: String, default: '' },
    status:       { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt:  { type: Date, default: null },
    version:      { type: Number, default: 1 },
  },
  { timestamps: true }
)

StoreThemeSchema.index({ storeId: 1 }, { unique: true })

const StoreTheme: Model<IStoreTheme> =
  mongoose.models.StoreTheme || mongoose.model<IStoreTheme>('StoreTheme', StoreThemeSchema)
export default StoreTheme

export const DEFAULT_TOKENS: IDesignTokens = {
  primaryColor:    '#3b82f6',
  secondaryColor:  '#1e40af',
  accentColor:     '#f59e0b',
  backgroundColor: '#ffffff',
  surfaceColor:    '#f8fafc',
  textColor:       '#0f172a',
  textSecondary:   '#64748b',
  borderColor:     '#e2e8f0',
  buttonRadius:    '0.75rem',
  cardRadius:      '1rem',
  fontFamily:      'Rubik',
  fontSize:        '16px',
  spacing:         'comfortable',
}

export const DEFAULT_SECTIONS = [
  { id: 'hero',        type: 'hero',        enabled: true,  order: 0,  settings: { headline: '', subheadline: '', ctaText: 'הזמן עכשיו' } },
  { id: 'benefits',    type: 'benefits',    enabled: true,  order: 1,  settings: {} },
  { id: 'product',     type: 'product',     enabled: true,  order: 2,  settings: {} },
  { id: 'social',      type: 'social_proof',enabled: true,  order: 3,  settings: {} },
  { id: 'features',    type: 'features',    enabled: true,  order: 4,  settings: {} },
  { id: 'faq',         type: 'faq',         enabled: true,  order: 5,  settings: {} },
  { id: 'guarantee',   type: 'guarantee',   enabled: true,  order: 6,  settings: {} },
  { id: 'urgency',     type: 'urgency',     enabled: false, order: 7,  settings: {} },
  { id: 'cta',         type: 'cta',         enabled: true,  order: 8,  settings: {} },
  { id: 'reviews',     type: 'reviews',     enabled: true,  order: 9,  settings: {} },
  { id: 'footer',      type: 'footer',      enabled: true,  order: 10, settings: {} },
]
