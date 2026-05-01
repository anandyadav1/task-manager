import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { getNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi, deleteNotificationApi } from '../api/tasks.api';
import { formatRelative } from '../utils/helpers';
import '../styles/notifications.css';

export default function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: async () => (await getNotificationsApi({ limit: 50 })).data });
  const markRead = useMutation({ mutationFn: (id) => markNotificationReadApi(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const markAll = useMutation({ mutationFn: () => markAllNotificationsReadApi(), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const del = useMutation({ mutationFn: (id) => deleteNotificationApi(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const list = data?.data || [];

  return (
    <div className="notifs">
      <div className="notifs-header">
        <h1>Notifications</h1>
        {data?.unreadCount > 0 && <button className="notifs-markall" onClick={() => markAll.mutate()}><CheckCheck size={16}/>Mark all read</button>}
      </div>
      {isLoading ? <div className="notifs-skeleton">{[...Array(5)].map((_,i)=><div key={i} className="notifs-skel"/>)}</div>
       : list.length === 0 ? <div className="notifs-empty"><Bell size={48} className="notifs-empty-icon"/><p>No notifications yet</p></div>
       : <div className="notifs-list">{list.map(n=>(
          <div key={n.id} className={`notif-item ${!n.isRead?'unread':''}`}>
            <div className="notif-item-body"><p className="notif-item-msg">{n.message}</p><p className="notif-item-time">{formatRelative(n.createdAt)}</p></div>
            <div className="notif-item-actions">
              {!n.isRead&&<button className="notif-btn read" onClick={()=>markRead.mutate(n.id)}><Check size={14}/></button>}
              <button className="notif-btn delete" onClick={()=>del.mutate(n.id)}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}</div>}
    </div>
  );
}
