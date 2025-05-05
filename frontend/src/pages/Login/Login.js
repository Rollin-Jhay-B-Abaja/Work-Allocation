import React, { useState, useEffect } from 'react';
import './Login.css';
import { login } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Add or remove class to body
  useEffect(() => {
    document.body.classList.add('no-scroll');

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const response = await login(username, password);
      if (response && response.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userRole', response.data.role);
        
        switch (response.data.role) {
          case 'admin':
            navigate('/dashboard');
            break;
          case 'manager':
            navigate('/manager-dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        setError(response?.data?.message || 'Invalid username or password');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        setError(error.response.data?.message || 'Login failed. Please try again.');
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="logo"></div>
        <h1 className="title">LYCEUM OF ALABANG</h1>
      </header>
      <main className="main">
        <div className="login-panel">
          <h2 className="login-title">Login</h2>
          <p className="login-subtitle">To get started</p>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label htmlFor="username" className="form-label">User name</label>
              <input
                type="text"
                id="username"
                className={`form-input ${error && !username.trim() ? 'error' : ''}`}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className={`form-input ${error && !password.trim() ? 'error' : ''}`}
                placeholder="************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group text-right">
              <button 
                type="button" 
                className="forgot-password"
                onClick={() => alert('Forgot password functionality coming soon')}
              >
                Forgot Password?
              </button>
            </div>
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
