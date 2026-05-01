import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Activity, LayoutList, Kanban, Plus, Trash2, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProjectApi, getMembersApi, getProjectActivityApi, inviteMemberApi } from '../api/projects.api';
import { getTasksApi, createTaskApi, updateTaskStatusApi, deleteTaskApi } from '../api/tasks.api';
import { formatDate, formatRelative, getInitials, getAvatarColor, getStatusLabel, getPriorityLabel, isOverdue } from '../utils/helpers';
import { KANBAN_COLUMNS, TASK_STATUSES, PRIORITIES } from '../utils/constants';
import useUiStore from '../store/uiStore';
import '../styles/project-detail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { taskViewMode, setTaskViewMode } = useUiStore();
  const [activeTab, setActiveTab] = useState('tasks');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'MEMBER' });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: async () => (await getProjectApi(id)).data.data });
  const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
  const { data: tasksData } = useQuery({ queryKey: ['tasks', id, filters], queryFn: async () => (await getTasksApi(id, { ...cleanFilters, limit: 100 })).data, enabled: activeTab === 'tasks' });
  const { data: members } = useQuery({ queryKey: ['members', id], queryFn: async () => (await getMembersApi(id)).data.data, enabled: activeTab === 'members' });
  const { data: activityData } = useQuery({ queryKey: ['activity', id], queryFn: async () => (await getProjectActivityApi(id, { limit: 50 })).data, enabled: activeTab === 'activity' });

  const inv = (k) => qc.invalidateQueries({ queryKey: k });
  const createTaskMut = useMutation({ mutationFn: (d) => createTaskApi(id, d), onSuccess: () => { inv(['tasks', id]); inv(['project', id]); toast.success('Task created'); setShowCreateTask(false); setNewTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO' }); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });
  const statusMut = useMutation({ mutationFn: ({ taskId, status }) => updateTaskStatusApi(id, taskId, { status }), onSuccess: () => { inv(['tasks', id]); inv(['project', id]); } });
  const deleteTaskMut = useMutation({ mutationFn: (taskId) => deleteTaskApi(id, taskId), onSuccess: () => { inv(['tasks', id]); toast.success('Task deleted'); } });
  const inviteMut = useMutation({ mutationFn: (d) => inviteMemberApi(id, d), onSuccess: () => { inv(['members', id]); toast.success('Member invited'); setShowInvite(false); }, onError: (e) => toast.error(e.response?.data?.message || 'Failed') });

  // ── Drag & Drop handlers ──
  const handleDragStart = (e, taskId) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    // slight delay so the browser captures the element before applying dragging style
    requestAnimationFrame(() => {
      e.target.classList.add('dragging');
    });
  };
  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDragTaskId(null);
    setDragOverCol(null);
  };
  const handleDragOver = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== col) setDragOverCol(col);
  };
  const handleDragLeave = (e, col) => {
    // only clear if actually leaving the column (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null);
  };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    // find the task's current status
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    // optimistic: update local cache immediately
    qc.setQueryData(['tasks', id, filters], (old) => {
      if (!old?.data) return old;
      return { ...old, data: old.data.map((t) => t.id === taskId ? { ...t, status: targetStatus } : t) };
    });
    // sync to backend
    statusMut.mutate({ taskId, status: targetStatus });
    toast.success(`Moved to ${getStatusLabel(targetStatus)}`);
  };

  const tasks = tasksData?.data || [];
  if (isLoading) return <div className="pd"><div style={{ height: 32, width: 256, background: '#e2e8f0', borderRadius: 12, marginBottom: 16 }} /><div style={{ height: 400, background: '#e2e8f0', borderRadius: 16 }} /></div>;
  if (!project) return <div className="pd"><p className="pd-empty">Project not found</p></div>;

  const tasksByStatus = {};
  KANBAN_COLUMNS.forEach((s) => { tasksByStatus[s] = tasks.filter((t) => t.status === s); });
  const ss = project.taskStats || {};

  return (
    <div className="pd">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="pd-title">{project.name}</h1>
          {project.description && <p className="pd-desc">{project.description}</p>}
          <div className="pd-meta">
            <span className={`pd-badge ${project.status === 'ACTIVE' ? 'active' : 'other'}`}>{project.status}</span>
            {project.deadline && <span className="pd-meta-text">Deadline: {formatDate(project.deadline)}</span>}
          </div>
        </div>
        <button className="pd-add-btn" onClick={() => setShowCreateTask(true)}><Plus size={16} /> Add Task</button>
      </div>

      <div className="pd-stats">
        {[['To Do', ss.todo||0, 'slate'], ['In Progress', ss.inProgress||0, 'blue'], ['In Review', ss.inReview||0, 'purple'], ['Done', ss.done||0, 'green'], ['Overdue', ss.overdue||0, 'red']].map(([l,v,c]) => (
          <div key={l} className="pd-stat"><div className={`pd-stat-val ${c}`}>{v}</div><div className="pd-stat-lbl">{l}</div></div>
        ))}
      </div>

      <div className="pd-tabs">
        {[['tasks','Tasks',LayoutList],['members','Members',Users],['activity','Activity',Activity]].map(([k,l,I]) => (
          <button key={k} className={`pd-tab ${activeTab===k?'active':''}`} onClick={() => setActiveTab(k)}><I size={16} />{l}</button>
        ))}
      </div>

      <div className="pd-content">
        {activeTab === 'tasks' && (<>
          <div className="pd-filters">
            <input value={filters.search} onChange={(e) => setFilters({...filters,search:e.target.value})} placeholder="Search tasks..." className="pd-filter-input" />
            <select value={filters.status} onChange={(e) => setFilters({...filters,status:e.target.value})} className="pd-filter-select"><option value="">All Statuses</option>{TASK_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
            <select value={filters.priority} onChange={(e) => setFilters({...filters,priority:e.target.value})} className="pd-filter-select"><option value="">All Priorities</option>{PRIORITIES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select>
            <div className="pd-view-toggle">
              <button className={`pd-view-btn ${taskViewMode==='kanban'?'active':''}`} onClick={() => setTaskViewMode('kanban')}><Kanban size={16}/></button>
              <button className={`pd-view-btn ${taskViewMode==='list'?'active':''}`} onClick={() => setTaskViewMode('list')}><LayoutList size={16}/></button>
            </div>
          </div>
          {taskViewMode === 'kanban' ? (
            <div className="pd-kanban">
              {KANBAN_COLUMNS.map(col => { const colColor = TASK_STATUSES.find(s=>s.value===col)?.color; return (
                <div
                  key={col}
                  className={`pd-kanban-col ${dragOverCol === col ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col)}
                  onDragLeave={(e) => handleDragLeave(e, col)}
                  onDrop={(e) => handleDrop(e, col)}
                >
                  <div className="pd-kanban-col-header"><div className="pd-kanban-col-title"><div className="pd-kanban-col-dot" style={{background:colColor}}/><span className="pd-kanban-col-name">{getStatusLabel(col)}</span></div><span className="pd-kanban-col-count">{tasksByStatus[col]?.length||0}</span></div>
                  {(tasksByStatus[col]||[]).map(t=>(
                    <div
                      key={t.id}
                      className={`pd-task-card ${dragTaskId === t.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="pd-task-card-title">{t.title}</div>
                      <div className="pd-task-card-meta">
                        <span className={`pd-priority ${t.priority?.toLowerCase()}`}>{getPriorityLabel(t.priority)}</span>
                        {t.assignedTo && <div className="pd-task-assignee" style={{background:getAvatarColor(t.assignedTo.name)}}>{getInitials(t.assignedTo.name)}</div>}
                      </div>
                      {t.dueDate && <div className={`pd-task-due ${isOverdue(t.dueDate,t.status)?'overdue':''}`}>{isOverdue(t.dueDate,t.status)?'⚠ ':''}{formatDate(t.dueDate)}</div>}
                    </div>
                  ))}
                  <button className="pd-kanban-add" onClick={() => {setNewTask({...newTask,status:col});setShowCreateTask(true);}}><Plus size={14}/>Add</button>
                </div>
              );})}
            </div>
          ) : (
            <div className="pd-table-wrap"><table className="pd-table"><thead><tr>{['Title','Status','Priority','Assignee','Due Date',''].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
              {tasks.map(t=>(
                <tr key={t.id}>
                  <td className="pd-table-title">{t.title}</td>
                  <td><select value={t.status} onChange={e=>statusMut.mutate({taskId:t.id,status:e.target.value})} className="pd-table-status">{TASK_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></td>
                  <td><span className={`pd-priority ${t.priority?.toLowerCase()}`}>{getPriorityLabel(t.priority)}</span></td>
                  <td>{t.assignedTo?.name||'—'}</td>
                  <td className={isOverdue(t.dueDate,t.status)?'pd-task-due overdue':''}>{formatDate(t.dueDate)}</td>
                  <td><button className="pd-table-delete" onClick={()=>deleteTaskMut.mutate(t.id)}><Trash2 size={14}/></button></td>
                </tr>
              ))}
              {tasks.length===0&&<tr><td colSpan={6} className="pd-table-empty">No tasks found</td></tr>}
            </tbody></table></div>
          )}
        </>)}

        {activeTab === 'members' && (<>
          <div className="pd-members-header"><button className="pd-invite-btn" onClick={()=>setShowInvite(true)}><UserPlus size={16}/>Invite</button></div>
          <div className="pd-members-grid">{(members||[]).map(m=>(
            <div key={m.id} className="pd-member-card">
              <div className="pd-member-avatar" style={{background:getAvatarColor(m.user?.name)}}>{getInitials(m.user?.name)}</div>
              <div style={{flex:1,minWidth:0}}><div className="pd-member-name">{m.user?.name}</div><div className="pd-member-email">{m.user?.email}</div><span className="pd-member-role">{m.role}</span></div>
            </div>
          ))}</div>
        </>)}

        {activeTab === 'activity' && (<>
          {(activityData?.data||[]).map(a=>(
            <div key={a.id} className="pd-activity-item">
              <div className="pd-activity-avatar" style={{background:getAvatarColor(a.user?.name)}}>{getInitials(a.user?.name)}</div>
              <div><div className="pd-activity-text"><strong>{a.user?.name}</strong> {a.action.replace(/_/g,' ').toLowerCase()}</div><div className="pd-activity-time">{formatRelative(a.createdAt)}</div></div>
            </div>
          ))}
          {(!activityData?.data?.length)&&<p className="pd-empty">No activity yet</p>}
        </>)}
      </div>

      {showCreateTask&&(<div className="pd-modal-overlay" onClick={()=>setShowCreateTask(false)}><div className="pd-modal" onClick={e=>e.stopPropagation()}>
        <div className="pd-modal-header"><h2>Create Task</h2><button className="pd-modal-close" onClick={()=>setShowCreateTask(false)}><X size={18}/></button></div>
        <form className="pd-modal-form" onSubmit={e=>{e.preventDefault();createTaskMut.mutate(newTask);}}>
          <input value={newTask.title} onChange={e=>setNewTask({...newTask,title:e.target.value})} required minLength={3} className="pd-modal-input" placeholder="Task title"/>
          <textarea value={newTask.description} onChange={e=>setNewTask({...newTask,description:e.target.value})} rows={3} className="pd-modal-input" placeholder="Description"/>
          <div className="pd-modal-row">
            <select value={newTask.priority} onChange={e=>setNewTask({...newTask,priority:e.target.value})} className="pd-modal-input">{PRIORITIES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select>
            <select value={newTask.status} onChange={e=>setNewTask({...newTask,status:e.target.value})} className="pd-modal-input">{TASK_STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
          </div>
          <div className="pd-modal-actions"><button type="button" className="pd-modal-cancel" onClick={()=>setShowCreateTask(false)}>Cancel</button><button type="submit" className="pd-modal-submit" disabled={createTaskMut.isPending}>{createTaskMut.isPending?'Creating...':'Create'}</button></div>
        </form>
      </div></div>)}

      {showInvite&&(<div className="pd-modal-overlay" onClick={()=>setShowInvite(false)}><div className="pd-modal pd-modal-sm" onClick={e=>e.stopPropagation()}>
        <div className="pd-modal-header"><h2>Invite Member</h2><button className="pd-modal-close" onClick={()=>setShowInvite(false)}><X size={18}/></button></div>
        <form className="pd-modal-form" onSubmit={e=>{e.preventDefault();inviteMut.mutate(inviteData);}}>
          <input value={inviteData.email} onChange={e=>setInviteData({...inviteData,email:e.target.value})} type="email" required className="pd-modal-input" placeholder="Email address"/>
          <select value={inviteData.role} onChange={e=>setInviteData({...inviteData,role:e.target.value})} className="pd-modal-input"><option value="MEMBER">Member</option><option value="MANAGER">Manager</option><option value="VIEWER">Viewer</option></select>
          <div className="pd-modal-actions"><button type="button" className="pd-modal-cancel" onClick={()=>setShowInvite(false)}>Cancel</button><button type="submit" className="pd-modal-submit" disabled={inviteMut.isPending}>{inviteMut.isPending?'Inviting...':'Invite'}</button></div>
        </form>
      </div></div>)}
    </div>
  );
}
