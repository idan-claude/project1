import { connectDB } from '@/lib/db/mongoose'
import StoreTheme, {
  DEFAULT_HEADER,
  DEFAULT_FOOTER,
  IHeaderConfig,
  IFooterConfig,
} from '@/lib/db/models/StoreTheme'
import Store from '@/lib/db/models/Store'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HomePageClient, { type SectionContent, type BenefitItem } from './_components/HomePageClient'

export default async function HomePage() {
  let headerConfig: IHeaderConfig = { ...DEFAULT_HEADER }
  let footerConfig: IFooterConfig = { ...DEFAULT_FOOTER }
  let logoUrl = ''
  let storeName = 'FindCard'
  let content: SectionContent = {}

  try {
    await connectDB()
    const storeId = process.env.STORE_ID || 'default'
    const [theme, store] = await Promise.all([
      StoreTheme.findOne({ storeId }).lean(),
      Store.findOne({ storeId }).select('name').lean(),
    ])
    if (store?.name) storeName = store.name
    if (theme?.logoUrl) logoUrl = theme.logoUrl
    if (theme?.headerConfig) headerConfig = { ...DEFAULT_HEADER, ...(theme.headerConfig as unknown as IHeaderConfig) }
    if (theme?.footerConfig) footerConfig = { ...DEFAULT_FOOTER, ...(theme.footerConfig as unknown as IFooterConfig) }

    if (theme?.sections) {
      const s = (id: string) => theme.sections.find((x) => x.id === id)?.settings as Record<string, unknown> | undefined

      const hero = s('hero')
      const benefits = s('benefits')
      const guarantee = s('guarantee')
      const cta = s('cta')

      content = {
        heroHeadline:    (hero?.headline     as string) || '',
        heroSubheadline: (hero?.subheadline  as string) || '',
        heroBadge:       (hero?.badge        as string) || '',
        heroCtaText:     (hero?.ctaText      as string) || '',
        benefitItems:    (benefits?.items    as BenefitItem[]) || [],
        guaranteeHeadline: (guarantee?.headline as string) || '',
        guaranteeBody:     (guarantee?.body     as string) || '',
        ctaHeadline:     (cta?.headline   as string) || '',
        ctaBody:         (cta?.body       as string) || '',
        ctaButtonText:   (cta?.ctaText    as string) || '',
      }
    }
  } catch {
    // fall through to defaults
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header headerConfig={headerConfig} logoUrl={logoUrl} storeName={storeName} />
      <main className="flex-1">
        <HomePageClient content={content} />
      </main>
      <Footer footerConfig={footerConfig} storeName={storeName} />
    </div>
  )
}
