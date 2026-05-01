import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Bell, User, LogOut, ChevronLeft, ChevronRight, Shield, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import '../../styles/sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];
  if (user?.role === 'ADMIN') navItems.push({ to: '/admin', icon: Shield, label: 'Admin Panel' });

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><Sparkles size={20} /></div>
        {sidebarOpen && <span className="sidebar-logo-text">TaskFlow</span>}
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={20} className="sidebar-link-icon" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <div className="sidebar-avatar" style={{ background: getAvatarColor(user?.name) }}>{getInitials(user?.name)}</div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut size={20} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>

      <button onClick={toggleSidebar} className="sidebar-toggle">
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  );
}
