import type { PaymentProvider, ProviderRegistryEntry } from './types'
import cardcom from './providers/cardcom'
import payplus from './providers/payplus'
import tranzila from './providers/tranzila'
import meshulam from './providers/meshulam'
import hyp from './providers/hyp'
import grow from './providers/grow'
import stripe from './providers/stripe'
import paypal from './providers/paypal'

// All known providers — order is the display/fallback order
export const ALL_PROVIDERS: PaymentProvider[] = [
  cardcom,
  payplus,
  tranzila,
  meshulam,
  hyp,
  grow,
  stripe,
  paypal,
]

export type ProviderSettings = {
  providerId: string
  enabled: boolean
  priority: number  // lower = higher priority
}

// Default settings: only cardcom enabled
export const DEFAULT_SETTINGS: ProviderSettings[] = ALL_PROVIDERS.map((p, i) => ({
  providerId: p.id,
  enabled: p.id === 'cardcom',
  priority: i,
}))

export function buildRegistry(settings: ProviderSettings[]): ProviderRegistryEntry[] {
  const settingsMap = new Map(settings.map(s => [s.providerId, s]))

  return ALL_PROVIDERS
    .map(provider => {
      const s = settingsMap.get(provider.id) ?? { enabled: false, priority: 99 }
      return { provider, enabled: s.enabled, priority: s.priority }
    })
    .sort((a, b) => a.priority - b.priority)
}

export function getActiveProvider(registry: ProviderRegistryEntry[]): PaymentProvider | null {
  const entry = registry.find(e => e.enabled && e.provider.isConfigured())
  return entry?.provider ?? null
}
