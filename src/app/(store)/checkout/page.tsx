import { connectDB } from '@/lib/db/mongoose'
import StoreTheme, {
  DEFAULT_CHECKOUT,
  DEFAULT_HEADER,
  ICheckoutConfig,
  IHeaderConfig,
} from '@/lib/db/models/StoreTheme'
import Store from '@/lib/db/models/Store'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage() {
  let checkoutConfig: ICheckoutConfig = { ...DEFAULT_CHECKOUT }
  let headerConfig: IHeaderConfig = { ...DEFAULT_HEADER }
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
    if (theme?.checkoutConfig) checkoutConfig = { ...DEFAULT_CHECKOUT, ...(theme.checkoutConfig as unknown as ICheckoutConfig) }
    if (theme?.headerConfig)   headerConfig   = { ...DEFAULT_HEADER,   ...(theme.headerConfig   as unknown as IHeaderConfig) }
    if (theme?.logoUrl) logoUrl = theme.logoUrl
  } catch {
    // fall through to defaults
  }

  return (
    <CheckoutClient
      checkoutConfig={checkoutConfig}
      headerConfig={headerConfig}
      logoUrl={logoUrl}
      storeName={storeName}
    />
  )
}
