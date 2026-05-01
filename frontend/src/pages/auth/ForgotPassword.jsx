import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPasswordApi } from '../../api/auth.api';
import '../../styles/auth.css';

const schema = z.object({ email: z.string().email('Invalid email') });

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });
  const onSubmit = async (data) => { try { await forgotPasswordApi(data); toast.success('Reset link sent if email exists.'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-logo"><div className="auth-logo-icon"><Sparkles size={20}/></div><span>TaskFlow</span></div>
        <h2>Forgot your password?</h2>
        <p className="auth-sub">Enter your email and we'll send you a reset link</p>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="auth-field"><label>Email</label><input type="email" {...register('email')} className={`auth-input ${errors.email?'error':''}`} placeholder="you@example.com"/>{errors.email&&<p className="auth-error">{errors.email.message}</p>}</div>
          <button type="submit" disabled={isSubmitting} className="auth-submit">{isSubmitting?<div className="auth-spinner"/>:<><Mail size={18}/>Send Reset Link</>}</button>
        </form>
        <p className="auth-link"><Link to="/login">Back to login</Link></p>
      </div>
    </div>
  );
}
