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

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  let headerConfig: IHeaderConfig = { ...DEFAULT_HEADER }
  let footerConfig: IFooterConfig = { ...DEFAULT_FOOTER }
  let logoUrl = ''
  let storeName = 'FindCard'

  try {
    await connectDB()
    const storeId = process.env.STORE_ID || 'default'

    const [theme, store] = await Promise.all([
      StoreTheme.findOne({ storeId }).lean(),
      Store.findOne({ storeId }).select('name').lean(),
    ])

    if (store?.name) storeName = store.name

    if (theme) {
      if (theme.logoUrl) logoUrl = theme.logoUrl
      if (theme.headerConfig) {
        headerConfig = { ...DEFAULT_HEADER, ...(theme.headerConfig as unknown as IHeaderConfig) }
      }
      if (theme.footerConfig) {
        footerConfig = { ...DEFAULT_FOOTER, ...(theme.footerConfig as unknown as IFooterConfig) }
      }
    }
  } catch {
    // fall through to defaults — storefront renders without DB config
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header headerConfig={headerConfig} logoUrl={logoUrl} storeName={storeName} />
      <main className="flex-1">{children}</main>
      <Footer footerConfig={footerConfig} storeName={storeName} />
    </div>
  )
}
