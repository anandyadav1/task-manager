import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import '../../styles/auth.css';

const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

export default function Register() {
  const [showPw, setShowPw] = useState(false);
  const { register: regUser } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try { await regUser({ name: data.name, email: data.email, password: data.password }); toast.success('Registration successful!'); navigate('/login'); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-logo"><div className="auth-logo-icon"><Sparkles size={20}/></div><span>TaskFlow</span></div>
        <h2>Create your account</h2>
        <p className="auth-sub">Start managing your tasks today</p>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="auth-field"><label>Full Name</label><input {...register('name')} className={`auth-input ${errors.name?'error':''}`} placeholder="John Doe"/>{errors.name&&<p className="auth-error">{errors.name.message}</p>}</div>
          <div className="auth-field"><label>Email</label><input type="email" {...register('email')} className={`auth-input ${errors.email?'error':''}`} placeholder="you@example.com"/>{errors.email&&<p className="auth-error">{errors.email.message}</p>}</div>
          <div className="auth-field"><label>Password</label><div className="auth-pw-wrap"><input type={showPw?'text':'password'} {...register('password')} className={`auth-input ${errors.password?'error':''}`} placeholder="••••••••"/><button type="button" onClick={()=>setShowPw(!showPw)} className="auth-pw-toggle">{showPw?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{errors.password&&<p className="auth-error">{errors.password.message}</p>}</div>
          <div className="auth-field"><label>Confirm Password</label><input type="password" {...register('confirmPassword')} className={`auth-input ${errors.confirmPassword?'error':''}`} placeholder="••••••••"/>{errors.confirmPassword&&<p className="auth-error">{errors.confirmPassword.message}</p>}</div>
          <button type="submit" disabled={isSubmitting} className="auth-submit">{isSubmitting?<div className="auth-spinner"/>:<><UserPlus size={18}/>Create Account</>}</button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
