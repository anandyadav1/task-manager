export const TASK_STATUSES = [
  { value: 'TODO', label: 'To Do', color: '#64748b' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6' },
  { value: 'IN_REVIEW', label: 'In Review', color: '#8b5cf6' },
  { value: 'DONE', label: 'Done', color: '#10b981' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#ef4444' },
];

export const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#3b82f6' },
  { value: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
  { value: 'HIGH', label: 'High', color: '#f97316' },
  { value: 'URGENT', label: 'Urgent', color: '#ef4444' },
];

export const PROJECT_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: '#10b981' },
  { value: 'ARCHIVED', label: 'Archived', color: '#64748b' },
  { value: 'COMPLETED', label: 'Completed', color: '#3b82f6' },
];

export const PROJECT_ROLES = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
];

export const KANBAN_COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
