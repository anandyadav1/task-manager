import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderKanban, Grid3X3, List, Search, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProjectsApi, createProjectApi } from '../api/projects.api';
import { formatDate, getInitials, getAvatarColor } from '../utils/helpers';
import '../styles/projects.css';

export default function Projects() {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', deadline: '' });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({ queryKey: ['projects', search], queryFn: async () => { const { data } = await getProjectsApi({ search, limit: 50 }); return data; } });
  const createMut = useMutation({ mutationFn: (d) => createProjectApi(d), onSuccess: (res) => { queryClient.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created!'); setShowCreate(false); navigate(`/projects/${res.data.data.id}`); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
  const projects = data?.data || [];

  return (
    <div className="projects">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p className="count">{data?.pagination?.total || 0} projects total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="projects-create-btn"><Plus size={18} /> New Project</button>
      </div>

      <div className="projects-toolbar">
        <div className="projects-search-wrap">
          <Search size={16} className="projects-search-icon" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="projects-search" />
        </div>
        <div className="projects-view-toggle">
          <button className={`projects-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid3X3 size={16} /></button>
          <button className={`projects-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={16} /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="projects-skeleton">{[...Array(6)].map((_, i) => <div key={i} className="projects-skel-item" />)}</div>
      ) : projects.length === 0 ? (
        <div className="projects-empty">
          <FolderKanban size={48} className="projects-empty-icon" />
          <p>No projects yet</p>
          <p>Create your first project to get started</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'projects-grid' : 'projects-list'}>
          {projects.map((p) => {
            const progress = p.taskStats?.total > 0 ? Math.round((p.taskStats.done / p.taskStats.total) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="project-card">
                <div className="project-card-top">
                  <span className="project-card-name">{p.name}</span>
                  <span className={`project-card-status ${p.status === 'ACTIVE' ? 'active' : 'other'}`}>{p.status}</span>
                </div>
                {p.description && <p className="project-card-desc">{p.description}</p>}
                <div className="project-card-progress-header"><span>Progress</span><span>{progress}%</span></div>
                <div className="project-card-track"><div className="project-card-fill" style={{ width: `${progress}%` }} /></div>
                <div className="project-card-footer">
                  <div className="project-card-members">
                    {(p.members || []).slice(0, 4).map((m) => (
                      <div key={m.id} className="project-card-member" style={{ background: getAvatarColor(m.user?.name) }}>{getInitials(m.user?.name)}</div>
                    ))}
                  </div>
                  {p.deadline && <span className="project-card-deadline"><Calendar size={11} />{formatDate(p.deadline)}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="projects-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="projects-modal" onClick={(e) => e.stopPropagation()}>
            <div className="projects-modal-header">
              <h2>Create New Project</h2>
              <button className="projects-modal-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <form className="projects-modal-form" onSubmit={(e) => { e.preventDefault(); createMut.mutate({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined }); }}>
              <div><label>Project Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} className="projects-modal-input" placeholder="My Awesome Project" /></div>
              <div><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="projects-modal-input" placeholder="What's this project about?" /></div>
              <div><label>Deadline</label><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="projects-modal-input" /></div>
              <div className="projects-modal-actions">
                <button type="button" className="projects-modal-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="projects-modal-submit" disabled={createMut.isPending}>{createMut.isPending ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
