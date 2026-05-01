import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, AlertTriangle, ListTodo, ArrowRight, FolderKanban, UserCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { getDashboardApi } from '../api/dashboard.api';
import { formatRelative, getInitials, getAvatarColor, getStatusLabel } from '../utils/helpers';
import '../styles/dashboard.css';

const COLORS = { TODO: '#64748b', IN_PROGRESS: '#3b82f6', IN_REVIEW: '#8b5cf6', DONE: '#10b981', CANCELLED: '#ef4444' };

export default function Dashboard() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => { const { data } = await getDashboardApi(); return data.data; },
    refetchInterval: 60000,
  });

  if (isLoading) return (
    <div className="dash">
      <div className="dash-skeleton" style={{ height: 32, width: 256, marginBottom: 16 }} />
      <div className="dash-stats">{[...Array(4)].map((_, i) => <div key={i} className="dash-skeleton" style={{ height: 112 }} />)}</div>
      <div className="dash-charts"><div className="dash-skeleton" style={{ height: 320 }} /><div className="dash-skeleton" style={{ height: 320 }} /></div>
    </div>
  );

  const stats = data?.stats || {};
  const chartData = (data?.tasksByStatus || []).map((s) => ({ name: getStatusLabel(s.status), value: s.count, color: COLORS[s.status] }));
  const weeklyData = (data?.weeklyCompletion || []).map((w) => ({ name: w.label, completed: w.completed }));
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || isAdmin;

  return (
    <div className="dash">
      <div className="dash-greeting">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>
          {isAdmin
            ? "Here's an overview of all projects and tasks across your team."
            : "Here's what's happening with your tasks today."}
        </p>
      </div>

      {/* Primary stats — project-wide for admin/manager, personal for members */}
      <div className="dash-stats">
        {[
          { label: isManager ? 'Total Tasks' : 'My Tasks', value: stats.totalTasks || 0, icon: ListTodo, cls: 'indigo' },
          { label: 'In Progress', value: stats.inProgress || 0, icon: Clock, cls: 'blue' },
          { label: 'Overdue', value: stats.overdue || 0, icon: AlertTriangle, cls: 'red' },
          { label: 'Completed Today', value: stats.completedToday || 0, icon: CheckCircle2, cls: 'green' },
        ].map((c) => (
          <div key={c.label} className="dash-stat-card">
            <div className={`dash-stat-icon ${c.cls}`}><c.icon size={20} /></div>
            <div className="dash-stat-value">{c.value}</div>
            <div className="dash-stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* If admin/manager, show a secondary row with personal stats */}
      {isManager && stats.myTotalAssigned > 0 && (
        <div className="dash-personal-stats">
          <div className="dash-personal-label"><UserCheck size={14} /> My Assigned Tasks</div>
          <div className="dash-personal-row">
            <span><strong>{stats.myTotalAssigned}</strong> assigned</span>
            <span><strong>{stats.myInProgress || 0}</strong> in progress</span>
            <span><strong>{stats.myCompletedToday || 0}</strong> done today</span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="dash-charts">
        <div className="dash-chart-card">
          <h3>Tasks by Status</h3>
          <p className="chart-sub">{isManager ? 'All tasks across your projects' : 'Distribution of your tasks'}</p>
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                  {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie><Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13 }} /></PieChart>
              </ResponsiveContainer>
              <div className="dash-chart-legend">
                {chartData.map((e) => (<div key={e.name} className="dash-legend-item"><div className="dash-legend-dot" style={{ background: e.color }} />{e.name}: {e.value}</div>))}
              </div>
            </>
          ) : <div className="dash-no-data">No tasks yet</div>}
        </div>

        <div className="dash-chart-card">
          <h3>Weekly Completion</h3>
          <p className="chart-sub">{isManager ? 'Tasks completed across all projects' : 'Tasks you completed per week'}</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13 }} />
              <Bar dataKey="completed" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="dash-bottom">
        <div className="dash-section">
          <div className="dash-section-header">
            <h3><FolderKanban size={16} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />My Projects</h3>
            <Link to="/projects" className="dash-section-link">View all <ArrowRight size={14} /></Link>
          </div>
          {(data?.projects || []).length > 0 ? (data?.projects || []).map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="dash-project">
              <div className="dash-project-top">
                <span className="dash-project-name">{p.name}</span>
                <span className="dash-project-pct">{p.progress}%</span>
              </div>
              <div className="dash-progress-track"><div className="dash-progress-fill" style={{ width: `${p.progress}%` }} /></div>
              <div className="dash-project-count">{p.completedTasks}/{p.totalTasks} tasks completed</div>
            </Link>
          )) : <div className="dash-empty">No projects yet</div>}
        </div>

        <div className="dash-section">
          <div className="dash-section-header"><h3>Recent Activity</h3></div>
          {(data?.recentActivity || []).length > 0 ? (data?.recentActivity || []).map((a) => (
            <div key={a.id} className="dash-activity-item">
              <div className="dash-activity-avatar" style={{ background: getAvatarColor(a.user?.name) }}>{getInitials(a.user?.name)}</div>
              <div>
                <div className="dash-activity-text"><strong>{a.user?.name}</strong> {a.action.replace(/_/g, ' ').toLowerCase()}</div>
                <div className="dash-activity-time">{formatRelative(a.createdAt)}</div>
              </div>
            </div>
          )) : <div className="dash-empty">No recent activity</div>}
        </div>
      </div>
    </div>
  );
}
