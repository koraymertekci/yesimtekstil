// Sezon yardımcı fonksiyonları
// Ay numarasından sezon belirleme ve TR format

// Ay numarasından sezon belirleme (1-12)
export const getSeason = (month) => {
  if (month >= 3 && month <= 5) return 'İlkbahar'
  if (month >= 6 && month <= 8) return 'Yaz'
  if (month >= 9 && month <= 11) return 'Sonbahar'
  return 'Kış' // 12, 1, 2
}

// Ay isimleri (TR kısa format)
export const MONTH_NAMES_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
]

// Ay numarasından ay ismi (TR)
export const getMonthName = (month) => {
  return MONTH_NAMES_TR[month - 1] || ''
}

// Tarih objesinden "Oca 2026" formatı
export const formatMonthYear = (date) => {
  const month = getMonthName(date.getMonth() + 1)
  const year = date.getFullYear()
  return `${month} ${year}`
}

// Önümüzdeki N ayı listele
export const getNextMonths = (count = 6) => {
  const today = new Date()
  const months = []
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
    months.push({
      date,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      monthName: getMonthName(date.getMonth() + 1),
      label: formatMonthYear(date),
      season: getSeason(date.getMonth() + 1)
    })
  }
  
  return months
}

