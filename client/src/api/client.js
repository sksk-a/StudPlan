import axios from 'axios';
const api = axios.create({ baseURL: '/api', timeout: 15000 });
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('planner-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !['/auth/login', '/auth/register'].includes(error.config?.url)
    ) {
      window.dispatchEvent(new Event('planner-unauthorized'));
    }
    return Promise.reject(error);
  },
);
export function errorMessage(error) {
  const data = error.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return (
    data?.message || 'Не удалось связаться с сервером. Проверьте подключение и повторите попытку.'
  );
}
export default api;
