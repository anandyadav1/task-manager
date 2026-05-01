import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPasswordApi } from '../../api/auth.api';
import '../../styles/auth.css';

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get('token');
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const onSubmit = async (data) => { try { await resetPasswordApi({ token, password: data.password }); toast.success('Password reset!'); navigate('/login'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-logo"><div className="auth-logo-icon"><Sparkles size={20}/></div><span>TaskFlow</span></div>
        <h2>Reset Password</h2>
        <p className="auth-sub">Enter your new password</p>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="auth-field"><label>New Password</label><input type="password" {...register('password')} className={`auth-input ${errors.password?'error':''}`} placeholder="••••••••"/>{errors.password&&<p className="auth-error">{errors.password.message}</p>}</div>
          <div className="auth-field"><label>Confirm Password</label><input type="password" {...register('confirmPassword')} className={`auth-input ${errors.confirmPassword?'error':''}`} placeholder="••••••••"/>{errors.confirmPassword&&<p className="auth-error">{errors.confirmPassword.message}</p>}</div>
          <button type="submit" disabled={isSubmitting} className="auth-submit">{isSubmitting?<div className="auth-spinner"/>:<><Lock size={18}/>Reset Password</>}</button>
        </form>
        <p className="auth-link"><Link to="/login">Back to login</Link></p>
      </div>
    </div>
  );
}
