import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelative = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'DONE' || status === 'CANCELLED') return false;
  return isBefore(new Date(dueDate), new Date());
};

export const isDueSoon = (dueDate, status) => {
  if (!dueDate || status === 'DONE' || status === 'CANCELLED') return false;
  const now = new Date();
  const threeDaysLater = addDays(now, 3);
  return isAfter(new Date(dueDate), now) && isBefore(new Date(dueDate), threeDaysLater);
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarColor = (name) => {
  if (!name) return '#6366f1';
  const colors = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#2563eb',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getStatusLabel = (status) => {
  const labels = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
};

export const getPriorityLabel = (priority) => {
  const labels = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' };
  return labels[priority] || priority;
};

export const truncate = (str, length = 100) => {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
};
