(() => {
  const API = (path) => (window.AUTH_API_URL || 'http://localhost:3001/api') + path;
  const tokenKey = 'rp_auth_token';
  const getToken = () => localStorage.getItem(tokenKey);
  const setToken = (t) => localStorage.setItem(tokenKey, t);

  const qs = (s) => document.querySelector(s);
  const nameRow = qs('#name-row');
  const name = qs('#name');
  const email = qs('#email');
  const password = qs('#password');
  const errorRow = qs('#error-row');
  const error = qs('#error');
  const submit = qs('#submit');
  const toggle = qs('#toggle');
  const toggleText = qs('#toggle-text');

  let mode = 'login';

  const setMode = (m) => {
    mode = m;
    if (mode === 'login') {
      submit.textContent = 'Sign In';
      toggleText.textContent = 'New here?';
      toggle.textContent = 'Create an account';
      nameRow.style.display = 'none';
    } else {
      submit.textContent = 'Create Account';
      toggleText.textContent = 'Already have an account?';
      toggle.textContent = 'Sign in';
      nameRow.style.display = '';
    }
  };

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    setMode(mode === 'login' ? 'register' : 'login');
  });

  const showError = (msg) => {
    error.textContent = msg;
    errorRow.style.display = '';
  };

  const clearError = () => {
    error.textContent = '';
    errorRow.style.display = 'none';
  };

  const request = async (path, method, body) => {
    const res = await fetch(API(path), {
      method,
      headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    return res.json();
  };

  submit.addEventListener('click', async (e) => {
    e.preventDefault();
    clearError();
    submit.disabled = true;
    try {
      let token;
      if (mode === 'login') {
        const r = await request('/auth/login', 'POST', { email: email.value.trim(), password: password.value });
        token = r?.data?.token;
      } else {
        const r = await request('/auth/register', 'POST', { name: name.value.trim(), email: email.value.trim(), password: password.value });
        token = r?.data?.token;
      }
      if (token) setToken(token);
      // Redirect back to app with token in URL hash so different origins can read it
      const redirectTo = window.AUTH_REDIRECT_URL || 'http://localhost:3000';
      const url = `${redirectTo}#token=${encodeURIComponent(token || '')}`;
      window.location.href = url;
    } catch (err) {
      showError(err.message || 'Something went wrong');
    } finally {
      submit.disabled = false;
    }
  });

  // init
  setMode('login');
})();


