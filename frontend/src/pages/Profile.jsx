import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { updateProfileApi, changePasswordApi } from '../api/auth.api';
import { getInitials, getAvatarColor } from '../utils/helpers';
import '../styles/profile.css';

const profileSchema = z.object({ name: z.string().min(2).max(50) });
const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const pf = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name || '' } });
  const pw = useForm({ resolver: zodResolver(pwSchema) });

  const onProfile = async (data) => { try { const { data: r } = await updateProfileApi(data); updateUser(r.data); toast.success('Profile updated'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };
  const onPassword = async (data) => { try { await changePasswordApi({ currentPassword: data.currentPassword, newPassword: data.newPassword }); toast.success('Password changed'); pw.reset(); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };

  return (
    <div className="profile">
      <h1>Profile Settings</h1>
      <div className="profile-card">
        <div className="profile-avatar" style={{ background: getAvatarColor(user?.name) }}>{getInitials(user?.name)}</div>
        <div>
          <div className="profile-info-name">{user?.name}</div>
          <div className="profile-info-email">{user?.email}</div>
          <span className="profile-info-role">{user?.role}</span>
        </div>
      </div>
      <div className="profile-tabs">
        {[['profile','Profile',User],['password','Password',Lock]].map(([k,l,I])=>(
          <button key={k} className={`profile-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}><I size={16}/>{l}</button>
        ))}
      </div>
      {tab==='profile'&&(
        <form onSubmit={pf.handleSubmit(onProfile)} className="profile-form">
          <div><label className="profile-label">Full Name</label><input {...pf.register('name')} className="profile-input"/></div>
          <div><label className="profile-label">Email</label><input value={user?.email} disabled className="profile-input"/></div>
          <button type="submit" className="profile-btn"><Save size={16}/>Save Changes</button>
        </form>
      )}
      {tab==='password'&&(
        <form onSubmit={pw.handleSubmit(onPassword)} className="profile-form">
          {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm Password']].map(([f,l])=>(
            <div key={f}><label className="profile-label">{l}</label><input type="password" {...pw.register(f)} className="profile-input"/>{pw.formState.errors[f]&&<p className="profile-error">{pw.formState.errors[f].message}</p>}</div>
          ))}
          <button type="submit" className="profile-btn"><Lock size={16}/>Change Password</button>
        </form>
      )}
    </div>
  );
}
