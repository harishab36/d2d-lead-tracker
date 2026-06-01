const AUTH_KEY = 'd2d_auth';
const CREDS    = { username: 'd2d', password: 'd2d' };

export function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === '1';
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function initLogin(onSuccess: () => void): void {
  document.getElementById('login-form')!.addEventListener('submit', e => {
    e.preventDefault();
    const user  = (document.getElementById('login-username') as HTMLInputElement).value.trim();
    const pass  = (document.getElementById('login-password') as HTMLInputElement).value;
    const errEl = document.getElementById('login-error')!;
    const passEl = document.getElementById('login-password') as HTMLInputElement;

    if (user === CREDS.username && pass === CREDS.password) {
      localStorage.setItem(AUTH_KEY, '1');
      errEl.textContent = '';
      passEl.classList.remove('invalid');
      onSuccess();
    } else {
      errEl.textContent = 'Invalid username or password';
      passEl.classList.add('invalid');
      passEl.select();
    }
  });

  ['login-username', 'login-password'].forEach(id => {
    document.getElementById(id)!.addEventListener('input', () => {
      document.getElementById('login-error')!.textContent = '';
      document.getElementById('login-password')!.classList.remove('invalid');
    });
  });
}
