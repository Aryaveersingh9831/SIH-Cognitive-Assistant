import { API_BASE_URL } from './config';

export interface GameResultRequest {
  gameType: string;
  score: number;
  accuracy: number;
  reactionTime: number;
  mistakes: number;
  difficulty: number;
}

export interface GameResultResponse {
  id: number;
  gameType: string;
  score: number;
  accuracy: number;
  reactionTime: number;
  mistakes: number;
  difficulty: number;
  patientId: string;
  createdAt: string;
}

export async function submitGameResult(
  token: string,
  data: GameResultRequest
): Promise<GameResultResponse> {
  const response = await fetch(`${API_BASE_URL}/api/game-results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Could not save your game result.');
  }

  return response.json();
}
