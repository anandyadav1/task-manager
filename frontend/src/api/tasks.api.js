import api from './axios';

export const getTasksApi = (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params });
export const getTaskApi = (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}`);
export const createTaskApi = (projectId, data) => api.post(`/projects/${projectId}/tasks`, data);
export const updateTaskApi = (projectId, taskId, data) => api.patch(`/projects/${projectId}/tasks/${taskId}`, data);
export const deleteTaskApi = (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`);
export const updateTaskStatusApi = (projectId, taskId, data) => api.patch(`/projects/${projectId}/tasks/${taskId}/status`, data);
export const assignTaskApi = (projectId, taskId, data) => api.patch(`/projects/${projectId}/tasks/${taskId}/assign`, data);
export const reorderTaskApi = (projectId, taskId, data) => api.patch(`/projects/${projectId}/tasks/${taskId}/reorder`, data);
export const createSubtaskApi = (projectId, taskId, data) => api.post(`/projects/${projectId}/tasks/${taskId}/subtasks`, data);
export const getSubtasksApi = (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}/subtasks`);

// Comments
export const getCommentsApi = (taskId) => api.get(`/tasks/${taskId}/comments`);
export const createCommentApi = (taskId, data) => api.post(`/tasks/${taskId}/comments`, data);
export const updateCommentApi = (taskId, commentId, data) => api.patch(`/tasks/${taskId}/comments/${commentId}`, data);
export const deleteCommentApi = (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`);

// Attachments
export const uploadAttachmentApi = (taskId, formData) => api.post(`/tasks/${taskId}/attachments`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteAttachmentApi = (taskId, attachmentId) => api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);

// Notifications
export const getNotificationsApi = (params) => api.get('/notifications', { params });
export const markNotificationReadApi = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsReadApi = () => api.patch('/notifications/read-all');
export const deleteNotificationApi = (id) => api.delete(`/notifications/${id}`);
