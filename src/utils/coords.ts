/** Jackson отдаёт BigDecimal как число; в типах допускаем и string */
export function parseCoord(v: string | number | null | undefined): number {
  if (v == null) {
    return 0
  }
  const n = typeof v === 'number' ? v : Number(String(v).trim())
  return Number.isFinite(n) ? n : 0
}

export function parseOptionalNumber(v: string | number | null | undefined): number | null {
  if (v == null) {
    return null
  }
  const n = typeof v === 'number' ? v : Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}
