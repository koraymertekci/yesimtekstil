// Market Snapshot Utility
// Sadece Inflation sayfasında kullanılacak

/**
 * Güncel piyasa verilerini getirir
 * @returns {Object} { usdtry, eurtry, inflation12m, lastUpdated }
 */
export function getMarketSnapshot() {
  // Şimdilik mock veri, ileride API'den gelecek
  const now = new Date()
  
  // Mock güncel değerler
  const usdtry = 34.25
  const eurtry = 37.18
  const inflation12m = 64.27
  
  // Tarih formatı: 21.12.2025 21:05 (TR)
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  const lastUpdated = `${day}.${month}.${year} ${hours}:${minutes}`
  
  return {
    usdtry,
    eurtry,
    inflation12m,
    lastUpdated
  }
}
















