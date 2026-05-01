import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as projectsService from './projects.service.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectsService.createProject(req.user.id, req.body);
  res.status(201).json(ApiResponse.created(project, 'Project created'));
});

export const getProjects = asyncHandler(async (req, res) => {
  const { projects, pagination } = await projectsService.getProjects(
    req.user.id,
    req.user.role,
    req.query
  );
  res.json(ApiResponse.paginated(projects, pagination));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectsService.getProjectById(req.params.id);
  res.json(ApiResponse.success(project));
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectsService.updateProject(req.params.id, req.user.id, req.body);
  res.json(ApiResponse.success(project, 'Project updated'));
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectsService.deleteProject(req.params.id, req.user.id);
  res.json(ApiResponse.success(null, 'Project deleted'));
});

export const getProjectStats = asyncHandler(async (req, res) => {
  const stats = await projectsService.getProjectStats(req.params.id);
  res.json(ApiResponse.success(stats));
});

export const getProjectActivity = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await projectsService.getProjectActivity(req.params.id, page, limit);
  res.json(ApiResponse.paginated(result.activities, result.pagination));
});

// ─── Member Management ──────────────────────────────────

export const inviteMember = asyncHandler(async (req, res) => {
  const member = await projectsService.inviteMember(
    req.params.id,
    req.body.email,
    req.body.role,
    req.user.id
  );
  res.status(201).json(ApiResponse.created(member, 'Member invited'));
});

export const getMembers = asyncHandler(async (req, res) => {
  const members = await projectsService.getMembers(req.params.id);
  res.json(ApiResponse.success(members));
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const member = await projectsService.updateMemberRole(
    req.params.id,
    req.params.userId,
    req.body.role,
    req.user.id
  );
  res.json(ApiResponse.success(member, 'Member role updated'));
});

export const removeMember = asyncHandler(async (req, res) => {
  await projectsService.removeMember(req.params.id, req.params.userId, req.user.id);
  res.json(ApiResponse.success(null, 'Member removed'));
});
