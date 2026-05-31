/**
 * Page JSON Model — foundation for the AI Store Builder.
 * Pages are stored as JSON documents; the renderer maps block types to React components.
 * Designed for: editing, reordering, hiding, duplicating, versioning.
 */

export type BlockType =
  | 'hero'
  | 'benefits'
  | 'faq'
  | 'testimonials'
  | 'cta'
  | 'product_grid'
  | 'banner'
  | 'text'
  | 'image'
  | 'video'
  | 'divider'
  | 'countdown'
  | 'trust_badges'
  | 'newsletter'

export interface BlockBase {
  id: string
  type: BlockType
  visible: boolean
  order: number
  version: number
  locked?: boolean
}

export interface HeroBlock extends BlockBase {
  type: 'hero'
  data: {
    heading: string
    subheading: string
    ctaText: string
    ctaUrl: string
    imageUrl: string
    layout: 'centered' | 'split-right' | 'split-left'
    overlay?: boolean
  }
}

export interface BenefitsBlock extends BlockBase {
  type: 'benefits'
  data: {
    heading: string
    items: Array<{ icon: string; title: string; description: string }>
  }
}

export interface FaqBlock extends BlockBase {
  type: 'faq'
  data: {
    heading: string
    items: Array<{ question: string; answer: string }>
  }
}

export interface TestimonialsBlock extends BlockBase {
  type: 'testimonials'
  data: {
    heading: string
    items: Array<{ name: string; text: string; rating: number; avatarUrl?: string }>
  }
}

export interface CtaBlock extends BlockBase {
  type: 'cta'
  data: {
    heading: string
    subheading: string
    ctaText: string
    ctaUrl: string
    variant: 'primary' | 'secondary' | 'minimal'
  }
}

export interface ProductGridBlock extends BlockBase {
  type: 'product_grid'
  data: {
    heading: string
    productSlugs: string[]
    showPrices: boolean
    columns: 2 | 3 | 4
  }
}

export type Block =
  | HeroBlock
  | BenefitsBlock
  | FaqBlock
  | TestimonialsBlock
  | CtaBlock
  | ProductGridBlock
  | BlockBase

export interface PageDocument {
  id: string
  storeId: string
  slug: string
  title: string
  pageType: 'home' | 'landing' | 'product' | 'category' | 'custom'
  blocks: Block[]
  seo: {
    title: string
    description: string
    ogImage: string
  }
  status: 'published' | 'draft' | 'archived'
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface BlockOperation {
  type: 'add' | 'remove' | 'reorder' | 'update' | 'toggle-visibility' | 'duplicate'
  blockId: string
  payload?: Partial<Block>
  targetOrder?: number
}
