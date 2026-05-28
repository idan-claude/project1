import { makeStub } from './_stub'

export default makeStub({
  id: 'paypal',
  name: 'PayPal',
  description: 'תשלומים בינלאומיים — פייפאל',
  logoEmoji: '🅿️',
  countryCode: 'GLOBAL',
  docs: 'https://developer.paypal.com',
  envKeys: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
})
