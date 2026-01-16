// Müşteri/Marka Listesi
// Tek kaynak - Tüm uygulamada bu liste kullanılacak

export const CUSTOMERS = [
  'Aldi',
  'Bershka',
  'Calvin Klein',
  'Gerster',
  'Guess',
  'Lacoste',
  'Matheis',
  'Mudo',
  'Nike',
  'Polo Ralph Lauren',
  'Schlafgut',
  'Tchibo',
  'Tommy Hilfiger',
  'Tommy Jeans',
  'Under Armour',
  'Zara'
].sort() // Alfabetik sıralama

// Müşteri seçenekleri için kullanım
export const CUSTOMER_OPTIONS = [
  { value: 'ALL', label: 'Tüm Müşteriler' },
  ...CUSTOMERS.map(customer => ({ value: customer, label: customer }))
]


















