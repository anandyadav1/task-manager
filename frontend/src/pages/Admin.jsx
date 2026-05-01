import { useQuery } from '@tanstack/react-query';
import { Shield, Users, FolderKanban, ListTodo } from 'lucide-react';
import { getAdminStatsApi, getAdminUsersApi } from '../api/dashboard.api';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';
import '../styles/admin.css';

export default function Admin() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: async () => (await getAdminStatsApi()).data.data });
  const { data: usersData } = useQuery({ queryKey: ['admin-users'], queryFn: async () => (await getAdminUsersApi({ limit: 50 })).data });

  return (
    <div className="admin">
      <div className="admin-header"><div className="admin-header-icon"><Shield size={24}/></div><h1>Admin Panel</h1></div>
      <div className="admin-stats">
        {[['Total Users',stats?.totalUsers||0,Users,'indigo'],['Total Projects',stats?.totalProjects||0,FolderKanban,'green'],['Total Tasks',stats?.totalTasks||0,ListTodo,'amber']].map(([l,v,I,c])=>(
          <div key={l} className="admin-stat"><div className={`admin-stat-icon ${c}`}><I size={20}/></div><div className="admin-stat-val">{v}</div><div className="admin-stat-lbl">{l}</div></div>
        ))}
      </div>
      <div className="admin-table-wrap">
        <div className="admin-table-title">All Users</div>
        <table className="admin-table"><thead><tr>{['User','Email','Role','Tasks','Projects','Joined'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
          {(usersData?.data||[]).map(u=>(
            <tr key={u.id}>
              <td><div className="admin-user-cell"><div className="admin-user-avatar" style={{background:getAvatarColor(u.name)}}>{getInitials(u.name)}</div><span className="admin-user-name">{u.name}</span></div></td>
              <td>{u.email}</td>
              <td><span className={`admin-role ${u.role==='ADMIN'?'admin-badge':'member-badge'}`}>{u.role}</span></td>
              <td style={{color:'#94a3b8'}}>{u._count?.assignedTasks||0}</td>
              <td style={{color:'#94a3b8'}}>{u._count?.projectMembers||0}</td>
              <td style={{color:'#94a3b8',fontSize:12}}>{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}
