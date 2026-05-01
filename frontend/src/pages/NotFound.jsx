import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import '../styles/auth.css';

export default function NotFound() {
  return (
    <div className="notfound">
      <div className="notfound-content">
        <div className="notfound-404">404</div>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="notfound-btn"><Home size={18}/> Go to Dashboard</Link>
      </div>
    </div>
  );
}
