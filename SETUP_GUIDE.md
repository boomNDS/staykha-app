# Backend API Setup Guide

StayKha expects a REST API reachable at `VITE_API_URL` (default: `http://localhost:3000`).
All endpoints are under `/v1`, with auth under `/v1/auth`.

## Required endpoints

### Auth
- `POST /v1/auth/login` -> `{ token, user }`
- `POST /v1/auth/register` -> `{ user }`
- `POST /v1/auth/request-password-reset`
- `POST /v1/auth/confirm-password-reset`
- `POST /v1/auth/verify-email`

### Core resources
- `GET /v1/teams`, `POST /v1/teams`, `PATCH /v1/teams/:id`, `DELETE /v1/teams/:id`
- `GET /v1/buildings`, `POST /v1/buildings`, `PATCH /v1/buildings/:id`, `DELETE /v1/buildings/:id`
- `GET /v1/rooms`, `POST /v1/rooms`, `PATCH /v1/rooms/:id`, `DELETE /v1/rooms/:id`
- `POST /v1/rooms/bulk`
- `GET /v1/tenants`, `POST /v1/tenants`, `PATCH /v1/tenants/:id`, `DELETE /v1/tenants/:id`
- `GET /v1/readings`, `POST /v1/readings`, `PATCH /v1/readings/:id`
- `GET /v1/invoices`, `POST /v1/invoices/from-reading-group`, `PATCH /v1/invoices/:id`
- `GET /v1/invoices/:id/pdf`
- `GET /v1/settings`, `POST /v1/settings`, `PATCH /v1/settings/:teamId`
- `GET /v1/admins`, `DELETE /v1/admins/:id`
- `GET /v1/invitations`, `POST /v1/invitations`, `POST /v1/invitations/accept`, `DELETE /v1/invitations/:id`
- `PATCH /v1/users/:id`

### Auth header
Protected endpoints expect `Authorization: Bearer <token>`.

## Local development

1. Set `VITE_API_URL` in your `.env` file.
2. Run `pnpm dev` and open `http://localhost:5173`.
