# Authentication API

Base path: `/api/auth`

All endpoints exchange and return JSON (`Content-Type: application/json`).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DB_USERNAME` | no (defaults to `root`) | MySQL username |
| `DB_PASSWORD` | yes | MySQL password |
| `JWT_SECRET` | yes | HMAC signing key for JWTs. Must be at least 32 characters (256 bits) long. Never commit a real value. |
| `JWT_EXPIRATION_MS` | no (defaults to `86400000`, i.e. 24h) | JWT lifetime in milliseconds |

## POST /api/auth/register

Public. Creates a new user account.

**Request**

```json
{
  "name": "Ramesh Das",
  "phone": "9876543210",
  "password": "secret123",
  "role": "patient"
}
```

`role` accepts (case-insensitive): `patient`, `caregiver`, `health_worker`.

**Response — 201 Created**

For `PATIENT` accounts, a `patientId` (e.g. `PT-000001`) is generated and returned:

```json
{
  "message": "Registration successful",
  "role": "patient",
  "patientId": "PT-000001"
}
```

For `CAREGIVER` and `HEALTH_WORKER` accounts, `patientId` is omitted from the response (no identifier is generated):

```json
{
  "message": "Registration successful",
  "role": "caregiver"
}
```

`patientId` can also be used as the `identifier` at login.

**Errors**

| Status | Body | Cause |
|---|---|---|
| 400 | `{"message": "Phone number already registered"}` | phone already exists |
| 400 | `{"message": "Invalid role"}` | role not one of the supported values |
| 400 | `{"message": "<field> is required"}` / validation message | missing/invalid fields |

## POST /api/auth/login

Public. Authenticates a user by phone or patient ID.

**Request**

```json
{
  "identifier": "9876543210",
  "password": "secret123"
}
```

`identifier` may be either the registered `phone` or the generated `patientId` (e.g. `PT-000001`).

**Response — 200 OK**

```json
{
  "token": "<jwt>",
  "role": "patient",
  "userId": 1
}
```

**Errors**

| Status | Body | Cause |
|---|---|---|
| 401 | `{"message": "Invalid credentials"}` | unknown identifier or wrong password (same message for both, to avoid leaking which is wrong) |

## GET /api/auth/me

Protected. Requires a valid JWT.

**Request header**

```
Authorization: Bearer <jwt>
```

**Response — 200 OK**

```json
{
  "userId": 1,
  "role": "patient"
}
```

**Errors**

| Status | Body | Cause |
|---|---|---|
| 401 | `{"message": "Invalid or missing token"}` | no `Authorization` header, malformed header, invalid signature, or expired token |

## All other endpoints

Everything outside `/api/auth/register` and `/api/auth/login` requires a valid `Authorization: Bearer <jwt>` header. Missing/invalid tokens return 401; an authenticated user without the required role returns 403.
