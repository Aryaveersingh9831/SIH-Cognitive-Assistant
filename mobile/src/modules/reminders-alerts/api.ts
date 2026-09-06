// api.ts
// Sends reminder confirmations and missed-reminder alerts to the Spring Boot backend.
// Confirm exact endpoint paths/shape with the backend owner via docs/API_CONTRACT.md.

const BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

async function authHeaders(): Promise<Record<string, string>> {
    // TODO: wire this to wherever the login/auth module stores the JWT.
    const token = await getStoredJwt();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getStoredJwt(): Promise<string | null> {
    return null; // placeholder until auth module exists
}

export async function pushReminderConfirm(id: string, confirmedAtISO: string): Promise<void> {
    await fetch(`${BASE_URL}/api/reminders/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ confirmedAt: confirmedAtISO }),
    });
}

export async function pushMissedAlert(reminderId: string, patientId: number): Promise<void> {
    await fetch(`${BASE_URL}/api/caregiver/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ reminderId, patientId, type: 'MISSED_REMINDER' }),
    });
}
