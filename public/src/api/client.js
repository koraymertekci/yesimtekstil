import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

client.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

client.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: error.response.data || { error: 'Not Found', message: 'Endpoint bulunamadı' }
        }
      })
    }
    return Promise.reject(error)
  }
)

export default client

