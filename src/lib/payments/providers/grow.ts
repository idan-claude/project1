import { makeStub } from './_stub'

export default makeStub({
  id: 'grow',
  name: 'Grow',
  description: 'שירות תשלומים ישראלי — גרו',
  logoEmoji: '🌱',
  countryCode: 'IL',
  docs: 'https://grow.co.il/api',
  envKeys: ['GROW_API_KEY', 'GROW_MERCHANT_ID'],
})
