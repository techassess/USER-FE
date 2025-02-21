import { env } from '@/config/env';
import axios from 'axios';

const request = axios.create({
  baseURL:env.BASE_URL
})
// config request sending
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  config.headers.Authorization =  `Bearer ${token}`
  return config
})
export default request