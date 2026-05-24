// Prices are stored as integers in agorot (100 agorot = ₪1)
export function formatPrice(agorot: number): string {
  const hasDecimals = agorot % 100 !== 0
  return (agorot / 100).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })
}

export function agorotToNIS(agorot: number): number {
  return agorot / 100
}

export function NISToAgorot(nis: number): number {
  return Math.round(nis * 100)
}
