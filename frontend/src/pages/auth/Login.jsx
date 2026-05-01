import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import '../../styles/login.css';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try { await login(data); toast.success('Welcome back!'); navigate('/dashboard'); }
    catch (e) { toast.error(e.response?.data?.message || 'Login failed'); }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand-glow1" />
        <div className="login-brand-glow2" />
        <div className="login-brand-content">
          <div className="login-brand-logo"><Sparkles size={32} /></div>
          <h1>TaskFlow</h1>
          <p>Organize, collaborate, and ship faster with your team.</p>
          <div className="login-brand-tags">
            <span className="login-brand-tag">Kanban Boards</span>
            <span className="login-brand-tag">Real-time</span>
            <span className="login-brand-tag">Analytics</span>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-wrapper">
          <div className="login-mobile-logo">
            <div className="login-mobile-logo-icon"><Sparkles size={20} /></div>
            <span>TaskFlow</span>
          </div>

          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="login-field">
              <label>Email</label>
              <input type="email" {...register('email')} className={`login-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" />
              {errors.email && <p className="login-error">{errors.email.message}</p>}
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="login-pw-wrapper">
                <input type={showPw ? 'text' : 'password'} {...register('password')} className={`login-input ${errors.password ? 'error' : ''}`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="login-pw-toggle">{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
              {errors.password && <p className="login-error">{errors.password.message}</p>}
            </div>

            <div className="login-options">
              <label className="login-remember"><input type="checkbox" /><span>Remember me</span></label>
              <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="login-submit">
              {isSubmitting ? <div className="login-spinner" /> : <><LogIn size={18} /> Sign in</>}
            </button>
          </form>

          <p className="login-signup">Don't have an account? <Link to="/register">Create one</Link></p>

          <div className="login-demo">
            <div className="login-demo-title">Demo Credentials</div>
            <div className="login-demo-grid">
              <span>admin@demo.com</span><span>Admin@123</span>
              <span>manager@demo.com</span><span>Manager@123</span>
              <span>alice@demo.com</span><span>Alice@123</span>
              <span>bob@demo.com</span><span>Bob@123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
