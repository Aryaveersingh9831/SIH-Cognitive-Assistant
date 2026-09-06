import { API_BASE_URL } from './config';

export type Role = 'patient' | 'caregiver';

export interface LoginResponse {
  token: string;
  role?: Role; // optional in case backend doesn't return it yet
  userId?: string;
  name?: string;
}

export async function loginUser(
  username: string,
  password: string,
  selectedRole: Role
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role: selectedRole }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Invalid username or password.');
  }

  return response.json();
}