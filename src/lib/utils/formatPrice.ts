// Prices are stored as integers in agorot (100 agorot = ₪1)
export function formatPrice(agorot: number): string {
  return (agorot / 100).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function agorotToNIS(agorot: number): number {
  return agorot / 100
}

export function NISToAgorot(nis: number): number {
  return Math.round(nis * 100)
}
