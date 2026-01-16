import client from './client.js'

export const getProfitVariance = async (months = 6) => {
  const requestUrl = '/api/finance/profit-variance'
  const fullUrl = `${window.location.origin}${requestUrl}?months=${months}`
  
  console.log('getProfitVariance request:', {
    requestUrl,
    fullUrl,
    windowOrigin: window.location.origin,
    months
  })
  
  try {
    const response = await client.get('/finance/profit-variance', {
      params: { months }
    })
    
    if (response && response.success && response.data) {
      return response.data
    }
    
    if (response && response.data && !response.success) {
      throw new Error(response.data.error || 'API hatası')
    }
    
    return null
  } catch (error) {
    let errorMessage = 'API hatası'
    let statusCode = null
    
    if (error.response) {
      statusCode = error.response.status
      if (statusCode === 404) {
        errorMessage = `Backend route bulunamadı: ${requestUrl}`
        console.error('404 Error - Route not found:', {
          requestUrl,
          fullUrl,
          status: statusCode,
          response: error.response.data
        })
      } else if (statusCode >= 500) {
        errorMessage = error.response.data?.error || error.response.data?.message || 'Sunucu hatası'
      } else {
        errorMessage = error.response.data?.error || error.response.data?.message || error.message
      }
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Connection refused')) {
      errorMessage = 'Backend sunucusuna bağlanılamıyor. Backend çalışıyor mu kontrol edin.'
      statusCode = 'CONNECTION_REFUSED'
    } else if (error.request) {
      errorMessage = 'Sunucuya istek gönderilemedi. Backend çalışıyor mu kontrol edin.'
      statusCode = 'NO_RESPONSE'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    console.error('API error (getProfitVariance):', {
      message: errorMessage,
      status: statusCode,
      requestUrl,
      fullUrl,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    })
    
    const errorWithStatus = new Error(errorMessage)
    errorWithStatus.status = statusCode
    errorWithStatus.is404 = statusCode === 404
    throw errorWithStatus
  }
}

