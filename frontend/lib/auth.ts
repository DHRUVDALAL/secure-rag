export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
}

export function getStoredAuth(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, company: null, isAuthenticated: false };
  }

  const userStr = localStorage.getItem('user');
  const companyStr = localStorage.getItem('company');
  const token = localStorage.getItem('accessToken');

  if (!userStr || !token) {
    return { user: null, company: null, isAuthenticated: false };
  }

  try {
    return {
      user: JSON.parse(userStr),
      company: companyStr ? JSON.parse(companyStr) : null,
      isAuthenticated: true,
    };
  } catch {
    return { user: null, company: null, isAuthenticated: false };
  }
}

export function setStoredAuth(user: User, company: Company, accessToken: string, refreshToken: string) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('company', JSON.stringify(company));
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearStoredAuth() {
  localStorage.removeItem('user');
  localStorage.removeItem('company');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
