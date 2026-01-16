import client from './client.js'

/**
 * Kullanıcı giriş işlemi
 */
export const login = async (credentials) => {
  try {
    const response = await client.post('/auth/login', {
      kullanici_adi: credentials.username || credentials.kullanici_adi,
      sifre: credentials.password || credentials.sifre
    })
    
    if (response.success && response.data) {
      // Token'ı localStorage'a kaydet
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify({
          id: response.data.kullanici_id,
          username: response.data.kullanici_adi
        }))
      }
      return response.data
    }
    
    throw new Error('Giriş başarısız')
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

/**
 * Kullanıcı kayıt işlemi
 */
export const register = async (userData) => {
  try {
    const response = await client.post('/auth/register', {
      adi: userData.firstName || userData.adi,
      soyadi: userData.lastName || userData.soyadi,
      hesap_no: userData.accountNumber || userData.hesap_no,
      kullanici_adi: userData.username || userData.kullanici_adi,
      sifre: userData.password || userData.sifre
    })
    
    if (response.success) {
      return response.data
    }
    
    throw new Error('Kayıt başarısız')
  } catch (error) {
    console.error('Register error:', error)
    throw error
  }
}

/**
 * Kullanıcı çıkış işlemi
 */
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

/**
 * Mevcut kullanıcı bilgisini getir
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      return JSON.parse(userStr)
    }
    return null
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

/**
 * Token'ı getir
 */
export const getToken = () => {
  return localStorage.getItem('token')
}

/**
 * Tüm kullanıcıları getir (admin)
 */
export const getAllUsers = async () => {
  try {
    const response = await client.get('/auth/users')
    
    if (response.success && Array.isArray(response.data)) {
      return response.data
    }
    
    return []
  } catch (error) {
    console.error('Get all users error:', error)
    throw error
  }
}

