import client from './client.js'

export const getLateOrdersTrend = async (days = 60) => {
  try {
    const response = await client.get('/dashboard/late-orders-trend', {
      params: { days }
    })
    
    if (response && response.success && response.data) {
      return response.data
    }
    
    return null
  } catch (error) {
    let errorMessage = 'API hatası'
    let statusCode = null
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused')) {
      errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.'
      statusCode = 'CONNECTION_REFUSED'
    } else if (error.response) {
      errorMessage = error.response.data?.error || error.response.data?.message || error.message
      statusCode = error.response.status
    } else if (error.request) {
      errorMessage = 'Sunucuya istek gönderilemedi. Backend çalışıyor mu kontrol edin.'
      statusCode = 'NO_RESPONSE'
    } else {
      errorMessage = error.message || 'Bilinmeyen hata'
    }
    
    console.error('API error (getLateOrdersTrend):', {
      message: errorMessage,
      status: statusCode,
      code: error.code,
      url: error.config?.url,
      fullError: error
    })
    
    throw new Error(errorMessage)
  }
}

