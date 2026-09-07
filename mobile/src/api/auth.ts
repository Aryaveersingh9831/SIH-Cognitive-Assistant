import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const TOKEN_KEY = 'auth_token';

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

// --- Token storage ---

export async function saveAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function authFetch(path: string): Promise<Response> {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed (${response.status})`);
  }
  return response;
}

// --- /api/auth/me ---

export interface MeResponse {
  userId: number;
  role: Role;
}

export async function getMe(): Promise<MeResponse> {
  const response = await authFetch('/api/auth/me');
  return response.json();
}

// --- /api/progress/patient/{patientId} ---

export interface ProgressResponse {
  totalSessions: number;
  averageAccuracy: number;
  currentDifficulty: number;
  averageDifficulty: number;
  recentPerformanceTrend: string; // e.g. "improving" | "declining" | "stable"
}

export async function getPatientProgress(patientId: string | number): Promise<ProgressResponse> {
  const response = await authFetch(`/api/progress/patient/${patientId}`);
  return response.json();
}

// --- /api/game-results/patient/{patientId} ---

export interface GameResult {
  gameType: string;
  score: number;
  accuracy: number;
  reactionTime: number;
  mistakes: number;
  difficulty: number;
  createdAt: string;
}

export async function getPatientGameResults(patientId: string | number): Promise<GameResult[]> {
  const response = await authFetch(`/api/game-results/patient/${patientId}`);
  return response.json();
}

// --- /api/caregiver/patients ---

export interface CaregiverPatient {
  patientId: string;
  name: string;
  lastActive: string | null; // ISO timestamp of newest game result, or null if none
}

export async function getCaregiverPatients(): Promise<CaregiverPatient[]> {
  const response = await authFetch('/api/caregiver/patients');
  return response.json();
}