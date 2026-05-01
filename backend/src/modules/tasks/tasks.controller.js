import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as tasksService from './tasks.service.js';

export const createTask = asyncHandler(async (req, res) => {
  const task = await tasksService.createTask(req.params.projectId, req.user.id, req.body);
  res.status(201).json(ApiResponse.created(task, 'Task created'));
});

export const getTasks = asyncHandler(async (req, res) => {
  const { tasks, pagination } = await tasksService.getTasks(req.params.projectId, req.query);
  res.json(ApiResponse.paginated(tasks, pagination));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await tasksService.getTaskById(req.params.taskId);
  res.json(ApiResponse.success(task));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await tasksService.updateTask(req.params.taskId, req.user.id, req.body);
  res.json(ApiResponse.success(task, 'Task updated'));
});

export const deleteTask = asyncHandler(async (req, res) => {
  await tasksService.deleteTask(req.params.taskId, req.user.id);
  res.json(ApiResponse.success(null, 'Task deleted'));
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await tasksService.updateTaskStatus(req.params.taskId, req.body.status, req.user.id);
  res.json(ApiResponse.success(task, 'Task status updated'));
});

export const assignTask = asyncHandler(async (req, res) => {
  const task = await tasksService.assignTask(req.params.taskId, req.body.assignedToId, req.user.id);
  res.json(ApiResponse.success(task, 'Task assigned'));
});

export const reorderTask = asyncHandler(async (req, res) => {
  const task = await tasksService.reorderTask(req.params.taskId, req.body.status, req.body.order);
  res.json(ApiResponse.success(task, 'Task reordered'));
});

export const createSubtask = asyncHandler(async (req, res) => {
  const subtask = await tasksService.createSubtask(req.params.taskId, req.user.id, req.body);
  res.status(201).json(ApiResponse.created(subtask, 'Subtask created'));
});

export const getSubtasks = asyncHandler(async (req, res) => {
  const subtasks = await tasksService.getSubtasks(req.params.taskId);
  res.json(ApiResponse.success(subtasks));
});
