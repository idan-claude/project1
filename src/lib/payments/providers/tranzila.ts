import { makeStub } from './_stub'

export default makeStub({
  id: 'tranzila',
  name: 'Tranzila',
  description: 'שיא בתשלומים מקוונים — טרנזילה',
  logoEmoji: '🏦',
  countryCode: 'IL',
  docs: 'https://www.tranzila.com/api',
  envKeys: ['TRANZILA_TERMINAL', 'TRANZILA_SUPPLIER'],
})
