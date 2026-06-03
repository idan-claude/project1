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
  headingSize: string
  fontWeight: string
  lineHeight: string
  shadowIntensity: string
  containerWidth: string
  animationIntensity: string
}

export interface IHeaderConfig {
  announcementEnabled: boolean
  announcementText: string
  announcementBg: string
  stickyHeader: boolean
  ctaText: string
  ctaEnabled: boolean
  phone: string
  whatsapp: string
}

export interface IFooterConfig {
  tagline: string
  instagramUrl: string
  tiktokUrl: string
  whatsappUrl: string
  facebookUrl: string
  contactEmail: string
  contactPhone: string
  copyright: string
  showPaymentIcons: boolean
  showTrustBadges: boolean
}

export interface ICheckoutConfig {
  showSslBadge: boolean
  showGuaranteeBadge: boolean
  showReturnBadge: boolean
  showShippingBadge: boolean
  guaranteeText: string
  returnText: string
  shippingText: string
  showPaymentIcons: boolean
  securityText: string
}

export interface IStoreTheme extends Document {
  storeId: string
  name: string
  tokens: IDesignTokens
  logoUrl: string
  faviconUrl: string
  heroImageUrl: string
  headerConfig: IHeaderConfig
  footerConfig: IFooterConfig
  checkoutConfig: ICheckoutConfig
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
    primaryColor:       { type: String, default: '#3b82f6' },
    secondaryColor:     { type: String, default: '#1e40af' },
    accentColor:        { type: String, default: '#f59e0b' },
    backgroundColor:    { type: String, default: '#ffffff' },
    surfaceColor:       { type: String, default: '#f8fafc' },
    textColor:          { type: String, default: '#0f172a' },
    textSecondary:      { type: String, default: '#64748b' },
    borderColor:        { type: String, default: '#e2e8f0' },
    buttonRadius:       { type: String, default: '0.75rem' },
    cardRadius:         { type: String, default: '1rem' },
    fontFamily:         { type: String, default: 'Rubik' },
    fontSize:           { type: String, default: '16px' },
    spacing:            { type: String, default: 'comfortable' },
    headingSize:        { type: String, default: 'lg' },
    fontWeight:         { type: String, default: 'bold' },
    lineHeight:         { type: String, default: 'normal' },
    shadowIntensity:    { type: String, default: 'md' },
    containerWidth:     { type: String, default: 'lg' },
    animationIntensity: { type: String, default: 'subtle' },
  },
  { _id: false }
)

const HeaderConfigSchema = new Schema<IHeaderConfig>(
  {
    announcementEnabled: { type: Boolean, default: true },
    announcementText:    { type: String, default: '🚚 משלוח חינם על כל הזמנה' },
    announcementBg:      { type: String, default: '#1d4ed8' },
    stickyHeader:        { type: Boolean, default: true },
    ctaText:             { type: String, default: 'הזמן עכשיו' },
    ctaEnabled:          { type: Boolean, default: true },
    phone:               { type: String, default: '' },
    whatsapp:            { type: String, default: '' },
  },
  { _id: false }
)

const FooterConfigSchema = new Schema<IFooterConfig>(
  {
    tagline:         { type: String, default: '' },
    instagramUrl:    { type: String, default: '' },
    tiktokUrl:       { type: String, default: '' },
    whatsappUrl:     { type: String, default: '' },
    facebookUrl:     { type: String, default: '' },
    contactEmail:    { type: String, default: '' },
    contactPhone:    { type: String, default: '' },
    copyright:       { type: String, default: '' },
    showPaymentIcons: { type: Boolean, default: true },
    showTrustBadges:  { type: Boolean, default: true },
  },
  { _id: false }
)

const CheckoutConfigSchema = new Schema<ICheckoutConfig>(
  {
    showSslBadge:       { type: Boolean, default: true },
    showGuaranteeBadge: { type: Boolean, default: true },
    showReturnBadge:    { type: Boolean, default: true },
    showShippingBadge:  { type: Boolean, default: true },
    guaranteeText:      { type: String, default: 'אחריות לכל החיים' },
    returnText:         { type: String, default: '100 יום החזר כסף מלא' },
    shippingText:       { type: String, default: 'משלוח חינם · 7–14 ימי עסקים' },
    showPaymentIcons:   { type: Boolean, default: true },
    securityText:       { type: String, default: 'כל הפרטים מוצפנים ומאובטחים' },
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
    headerConfig: { type: HeaderConfigSchema, default: () => ({}) },
    footerConfig: { type: FooterConfigSchema, default: () => ({}) },
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
  primaryColor:       '#3b82f6',
  secondaryColor:     '#1e40af',
  accentColor:        '#f59e0b',
  backgroundColor:    '#ffffff',
  surfaceColor:       '#f8fafc',
  textColor:          '#0f172a',
  textSecondary:      '#64748b',
  borderColor:        '#e2e8f0',
  buttonRadius:       '0.75rem',
  cardRadius:         '1rem',
  fontFamily:         'Rubik',
  fontSize:           '16px',
  spacing:            'comfortable',
  headingSize:        'lg',
  fontWeight:         'bold',
  lineHeight:         'normal',
  shadowIntensity:    'md',
  containerWidth:     'lg',
  animationIntensity: 'subtle',
}

export const DEFAULT_HEADER: IHeaderConfig = {
  announcementEnabled: true,
  announcementText:    '🚚 משלוח חינם על כל הזמנה',
  announcementBg:      '#1d4ed8',
  stickyHeader:        true,
  ctaText:             'הזמן עכשיו',
  ctaEnabled:          true,
  phone:               '',
  whatsapp:            '',
}

export const DEFAULT_FOOTER: IFooterConfig = {
  tagline:          '',
  instagramUrl:     '',
  tiktokUrl:        '',
  whatsappUrl:      '',
  facebookUrl:      '',
  contactEmail:     '',
  contactPhone:     '',
  copyright:        '',
  showPaymentIcons: true,
  showTrustBadges:  true,
}

export const DEFAULT_SECTIONS = [
  { id: 'hero',     type: 'hero',        enabled: true,  order: 0,  settings: { headline: '', subheadline: '', ctaText: 'הזמן עכשיו' } },
  { id: 'benefits', type: 'benefits',    enabled: true,  order: 1,  settings: {} },
  { id: 'product',  type: 'product',     enabled: true,  order: 2,  settings: {} },
  { id: 'social',   type: 'social_proof',enabled: true,  order: 3,  settings: {} },
  { id: 'features', type: 'features',    enabled: true,  order: 4,  settings: {} },
  { id: 'faq',      type: 'faq',         enabled: true,  order: 5,  settings: {} },
  { id: 'guarantee',type: 'guarantee',   enabled: true,  order: 6,  settings: {} },
  { id: 'urgency',  type: 'urgency',     enabled: false, order: 7,  settings: {} },
  { id: 'cta',      type: 'cta',         enabled: true,  order: 8,  settings: {} },
  { id: 'reviews',  type: 'reviews',     enabled: true,  order: 9,  settings: {} },
  { id: 'footer',   type: 'footer',      enabled: true,  order: 10, settings: {} },
]
