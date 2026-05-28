import { makeStub } from './_stub'

export default makeStub({
  id: 'stripe',
  name: 'Stripe',
  description: 'תשלומים בינלאומיים — סטרייפ',
  logoEmoji: '🌐',
  countryCode: 'GLOBAL',
  docs: 'https://stripe.com/docs',
  envKeys: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
})
