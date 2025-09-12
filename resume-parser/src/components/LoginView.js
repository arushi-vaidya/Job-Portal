import React, { useState } from 'react';
import apiService from '../services/api';

const LoginView = ({ onLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await apiService.login(email, password)
        : await apiService.register(name, email, password);
      if (res?.success) {
        onLoggedIn(res.data.user); // Pass user data instead of just calling onLoggedIn()
      } else {
        setError(res?.message || 'Something went wrong');
      }
    } catch (err) {
      setError(err?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="login-subtitle">Sign in to manage your single resume profile</p>
        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="form-row">
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
          )}
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        <div className="login-toggle">
          {mode === 'login' ? (
            <span>New here? <button className="link-button" onClick={() => setMode('register')}>Create an account</button></span>
          ) : (
            <span>Already have an account? <button className="link-button" onClick={() => setMode('login')}>Sign in</button></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
