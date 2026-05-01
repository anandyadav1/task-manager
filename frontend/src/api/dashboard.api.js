import api from './axios';

export const getDashboardApi = () => api.get('/dashboard');
export const getAdminStatsApi = () => api.get('/admin/stats');
export const getAdminUsersApi = (params) => api.get('/admin/users', { params });
export const getAdminActivityApi = (params) => api.get('/admin/activity', { params });
export const getAllUsersApi = (params) => api.get('/users', { params });
export const updateUserRoleApi = (id, data) => api.patch(`/users/${id}/role`, data);
export const deleteUserApi = (id) => api.delete(`/users/${id}`);
