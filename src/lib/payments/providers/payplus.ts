import { makeStub } from './_stub'

export default makeStub({
  id: 'payplus',
  name: 'PayPlus',
  description: 'ממשק תשלום ישראלי — פיי פלוס',
  logoEmoji: '🔵',
  countryCode: 'IL',
  docs: 'https://payplus.co.il/developers',
  envKeys: ['PAYPLUS_API_KEY', 'PAYPLUS_SECRET_KEY'],
})
