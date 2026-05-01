import api from './axios';

export const loginApi = (data) => api.post('/auth/login', data);
export const registerApi = (data) => api.post('/auth/register', data);
export const logoutApi = () => api.post('/auth/logout');
export const refreshTokenApi = () => api.post('/auth/refresh-token');
export const getMeApi = () => api.get('/auth/me');
export const updateProfileApi = (data) => api.patch('/auth/me', data);
export const forgotPasswordApi = (data) => api.post('/auth/forgot-password', data);
export const resetPasswordApi = (data) => api.post('/auth/reset-password', data);
export const changePasswordApi = (data) => api.post('/auth/change-password', data);
