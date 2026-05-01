import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import useUiStore from '../../store/uiStore';
import { getNotificationsApi, markAllNotificationsReadApi } from '../../api/tasks.api';
import { formatRelative } from '../../utils/helpers';
import '../../styles/navbar.css';

export default function Navbar() {
  const { darkMode, toggleDarkMode, sidebarOpen, setSearchOpen } = useUiStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { fetchNotifications(); const i = setInterval(fetchNotifications, 30000); return () => clearInterval(i); }, []);
  useEffect(() => { const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  useEffect(() => { const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); } }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [setSearchOpen]);

  const fetchNotifications = async () => { try { const { data } = await getNotificationsApi({ limit: 10 }); setNotifications(data.data || []); setUnreadCount(data.unreadCount || 0); } catch {} };
  const handleMarkAllRead = async () => { try { await markAllNotificationsReadApi(); setUnreadCount(0); setNotifications((p) => p.map((n) => ({ ...n, isRead: true }))); } catch {} };

  return (
    <header className="navbar" style={{ marginLeft: sidebarOpen ? 260 : 72 }}>
      <button className="navbar-search" onClick={() => setSearchOpen(true)}>
        <Search size={16} />
        <span>Search...</span>
        <kbd>Ctrl+K</kbd>
      </button>

      <div className="navbar-actions">
        <button className="navbar-btn" onClick={toggleDarkMode}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="navbar-btn" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="navbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {showNotifs && (
            <div className="navbar-notif-dropdown">
              <div className="navbar-notif-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && <button onClick={handleMarkAllRead}>Mark all read</button>}
              </div>
              {notifications.length === 0 ? (
                <div className="navbar-notif-empty">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`navbar-notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => { if (n.link) navigate(n.link); setShowNotifs(false); }}>
                    <p>{n.message}</p>
                    <div className="time">{formatRelative(n.createdAt)}</div>
                  </div>
                ))
              )}
              <button className="navbar-notif-viewall" onClick={() => { navigate('/notifications'); setShowNotifs(false); }}>View all</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
