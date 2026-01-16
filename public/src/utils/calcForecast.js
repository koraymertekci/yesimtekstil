/**
 * DEPRECATED: Bu dosya artık kullanılmıyor.
 * Forecast sayfası sıfırlandı ve yeni bir yapı ile adım adım oluşturulacak.
 * Geri dönüş için referans olarak saklanıyor.
 */

// Forecast hesaplama yardımcı fonksiyonları
// Geçmiş veri analizi ve trend hesaplama

import { calculateForecast as calcForecast } from '../data/mockSeasonOrders'

// Forecast oluştur
export const createForecast = (customer, season) => {
  const forecast = calcForecast(customer, season)
  
  if (!forecast) {
    return null
  }
  
  // Sezon süresi (varsayılan)
  const seasonDurationDays = season === 'Yaz' ? 120 : 120
  
  return {
    ...forecast,
    seasonDurationDays,
    customer,
    season
  }
}

// Trend badge metni
export const getTrendBadge = (trendRate) => {
  if (trendRate > 5) return { text: 'Büyüyen Müşteri', color: 'success', icon: '↑' }
  if (trendRate > 0) return { text: 'Hafif Büyüme', color: 'info', icon: '↑' }
  if (trendRate < -5) return { text: 'Azalan Müşteri', color: 'warning', icon: '↓' }
  if (trendRate < 0) return { text: 'Hafif Azalma', color: 'warning', icon: '↓' }
  return { text: 'Stabil', color: 'secondary', icon: '→' }
}

