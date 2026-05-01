import api from './axios';

export const getProjectsApi = (params) => api.get('/projects', { params });
export const getProjectApi = (id) => api.get(`/projects/${id}`);
export const createProjectApi = (data) => api.post('/projects', data);
export const updateProjectApi = (id, data) => api.patch(`/projects/${id}`, data);
export const deleteProjectApi = (id) => api.delete(`/projects/${id}`);
export const getProjectStatsApi = (id) => api.get(`/projects/${id}/stats`);
export const getProjectActivityApi = (id, params) => api.get(`/projects/${id}/activity`, { params });

// Members
export const getMembersApi = (projectId) => api.get(`/projects/${projectId}/members`);
export const inviteMemberApi = (projectId, data) => api.post(`/projects/${projectId}/members`, data);
export const updateMemberRoleApi = (projectId, userId, data) => api.patch(`/projects/${projectId}/members/${userId}/role`, data);
export const removeMemberApi = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`);
