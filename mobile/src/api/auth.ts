import { API_BASE_URL } from './config';

export type Role = 'patient' | 'caregiver';

export interface LoginResponse {
  token: string;
  role: Role;
  userId: number;
}

export async function loginUser(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Invalid credentials.');
  }

  return response.json();
}

export interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
  role: Role;
}

export interface RegisterResponse {
  message: string;
  role: Role;
  patientId: string;
}

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Registration failed.');
  }

  return response.json();
}