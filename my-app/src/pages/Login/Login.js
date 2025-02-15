import React, { useState } from 'react';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
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
    // Handle login logic here
    console.log('Logging in with:', username, password);
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
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </main>
      <footer className="footer">
        © [(2024)] | [Lyceum of Alabang]
      </footer>
    </div>
  );
}

export default Login;
