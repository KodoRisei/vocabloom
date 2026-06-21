import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.error?.message ?? error.message;
    return Promise.reject(new Error(message));
  },
);

export default api;
