// Set EXPO_PUBLIC_API_BASE_URL in a local .env file (gitignored) so each
// teammate can point at their own machine without editing this file.
// See .env.example for the expected format.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';