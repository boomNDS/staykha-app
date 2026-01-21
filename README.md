# StayKha

![Vite 6.1.0](https://img.shields.io/badge/Vite-6.1.0-646CFF?logo=vite&logoColor=white)
![React 19.2.0](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=0B0F1A)
A modern dormitory and room management system with automated meter reading and billing capabilities. StayKha helps property owners manage buildings, rooms, tenants, capture monthly utility readings, and generate invoices seamlessly.

## Features

- **Building Management**: Create and manage multiple buildings with floor and room tracking
- **Room Management**: Track room status (occupied, vacant, maintenance), rent, and size with bulk creation support
- **Tenant Management**: Complete tenant profiles with contact information, move-in dates, contracts, and emergency contacts
- **Meter Readings**: Capture water and electric meter readings with photo uploads, grouped by room and month
- **Billing & Invoicing**: Automated invoice generation from meter readings with configurable rates and billing modes
- **Admin Management**: Multi-admin support with role-based access (owner/admin) and invitation system
- **Settings**: Configurable billing rates, company information, payment details (bank info, late payment penalties), Thai invoice labels, and default values
- **Dashboard**: Real-time overview with statistics, occupancy rates, and pending readings
- **Authentication**: Login, registration, and team onboarding (create or join a team)

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **TanStack Router** - Client-side routing
- **TanStack React Query** - Server state management
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations

### Backend
- **REST API** - Custom backend exposed under `/v1` with Bearer token auth

### Development Tools
- **Biome** - Linting and formatting
- **pnpm** - Package manager

## Prerequisites

- **Node.js** 18+ and **pnpm** installed
- **API server** running and reachable at `VITE_API_URL` (default: `http://localhost:3000`)
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd staykha-app-nextjs
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file in the root directory:
```bash
VITE_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
pnpm dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Backend API Setup Guide

StayKha expects a REST API exposed under `/v1` with Bearer token authentication. Ensure your API provides endpoints for auth and the core resources (teams, buildings, rooms, tenants, readings, invoices, settings, admins, invitations).

Minimal requirements:
- `POST /v1/auth/login` returns `{ token, user }`
- `POST /v1/auth/register` returns `{ user }`
- Resource endpoints under `/v1/<resource>` (e.g., `/v1/rooms`, `/v1/invoices`)

For detailed field definitions and access rules, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## User Flow Overview

```mermaid
flowchart TD
    A[Start] --> B{Login or Register}
    B -->|Owner| C[Create Team]
    B -->|Admin| D[Join Team via Invite Code]
    C --> E[Setup Checklist]
    D --> E

    E --> E1[Add Building]
    E1 --> E2[Create Rooms]
    E2 --> E3[Set Billing Settings]
    E3 --> E4[Invite Admins]
    E4 --> E5[Add Tenants]

    E5 --> F{Monthly Workflow}
    F --> F1[Capture Meter Readings]
    F1 --> F2[Review Readings]
    F2 --> F3[Generate Invoices]
    F3 --> F4[Send / Share Invoices]
    F4 --> F5[Track Payments]
    F5 --> F6[Reports & Dashboard]
```

## Entity Relationship Diagram

```mermaid
erDiagram
    Team ||--o{ User
    Team ||--o{ Building
    Team ||--o{ Room
    Team ||--o{ Tenant
    Team ||--o{ ReadingGroup
    Team ||--o{ Invoice
    Team ||--|| Settings
    Team ||--o{ AdminInvitation
    User ||--o{ Building
    User ||--o{ AdminInvitation
    Building ||--o{ Room
    Room ||--o| Tenant
    Room ||--o{ ReadingGroup
    ReadingGroup ||--o{ Invoice
    Tenant ||--o{ Invoice

    Team {
        string id PK
        string name
        date createdAt
        date updatedAt
    }

    User {
        string id PK
        string email
        string name
        string role
        string teamId FK
    }

    Building {
        string id PK
        string name
        string address
        number totalFloors
        number totalRooms
        number occupiedRooms
        string ownerId FK
        string teamId FK
    }

    Room {
        string id PK
        string roomNumber
        string buildingId FK
        string buildingName
        number floor
        string status
        number monthlyRent
        number size
        string tenantId FK
        string teamId FK
    }

    Tenant {
        string id PK
        string name
        string email
        string phone
        string roomId FK
        date moveInDate
        date contractEndDate
        number monthlyRent
        number deposit
        string idCardNumber
        string emergencyContact
        string emergencyPhone
        string status
        string teamId FK
    }

    ReadingGroup {
        string id PK
        string roomId FK
        string roomNumber
        string tenantName
        date readingDate
        string status
        json water
        json electric
        string teamId FK
    }

    Invoice {
        string id PK
        string invoiceNumber
        string tenantId FK
        string roomId FK
        string tenantName
        string roomNumber
        string billingPeriod
        date issueDate
        date dueDate
        string status
        number waterUsage
        number waterRate
        number waterAmount
        number electricUsage
        number electricRate
        number electricAmount
        number subtotal
        number tax
        number total
        date paidDate
        number waterConsumption
        number electricConsumption
        number waterRatePerUnit
        number electricRatePerUnit
        number waterSubtotal
        number electricSubtotal
        string waterBillingMode
        number waterFixedFee
        string readingGroupId FK
        json readings
        string teamId FK
    }

    Settings {
        string id PK
        string teamId FK
        number waterRatePerUnit
        string waterBillingMode "metered/fixed"
        number waterFixedFee
        number electricRatePerUnit
        number taxRate
        string currency
        string companyName
        string companyAddress
        string companyPhone
        string companyEmail
        string invoicePrefix
        number paymentTermsDays
        number defaultRoomRent
        number defaultRoomSize
        string bankName
        string bankAccountNumber
        string lineId
        number latePaymentPenaltyPerDay
        number dueDateDayOfMonth
        string labelInvoice
        string labelRoomRent
        string labelWater
        string labelElectricity
    }

    AdminInvitation {
        string id PK
        string email
        string teamId FK
        string invitedBy FK
        string invitedByName
        string status
        string inviteCode
        date expiresAt
        json buildings
    }
```

## Project Structure

```
staykha-app-nextjs/
├── src/
│   ├── app/                    # Application pages
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── buildings/     # Building management
│   │   │   ├── rooms/         # Room management
│   │   │   ├── tenants/      # Tenant management
│   │   │   ├── readings/     # Meter readings
│   │   │   ├── billing/       # Invoice management
│   │   │   ├── admins/        # Admin management
│   │   │   └── settings/      # Settings page
│   │   ├── login/             # Login page (registration, password reset not yet implemented)
│   │   └── page.tsx           # Home page
│   ├── router.tsx             # TanStack Router configuration
│   └── main.tsx               # Application entry point
├── components/                 # React components
│   ├── ui/                    # shadcn/ui components
│   ├── app-sidebar.tsx        # Main sidebar navigation
│   ├── data-table.tsx         # Reusable data table
│   └── ...                    # Other components
├── lib/                       # Utilities and API clients
│   ├── api-client.ts          # API client
│   ├── types.ts               # TypeScript type definitions
│   ├── schemas.ts             # Zod validation schemas
│   ├── auth-context.tsx       # Authentication context
│   └── utils.ts               # Utility functions
├── docs/                      # Documentation
├── public/                    # Static assets
├── package.json
├── vite.config.ts
└── README.md
```

## Development

### Running the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
pnpm build
```

### Linting and Formatting

```bash
# Check for linting errors
pnpm lint

# Format code
pnpm format
```

## API Integration

The application uses a REST API under `/v1`. All API calls go through `lib/api-client.ts`, which uses `ofetch` with Bearer token auth.

### Authentication

**Current Implementation:**
The application implements login and registration. Owners must create a team, and admins join a team. The app stores the auth token in `localStorage` and includes it in API requests via the `Authorization` header.

**Available Authentication Features:**
The API supports additional authentication features that can be implemented:

- ✅ **Login** - Implemented
- ✅ **User Registration** - Implemented
- ⚠️ **Password Reset / Forgot Password** - API available, UI not yet implemented
- ⚠️ **Email Verification** - API available, UI not yet implemented
- ⚠️ **Password Change** - API available, UI not yet implemented

Existing pages:
- `src/app/register/page.tsx` - User registration page
- `src/app/register/create-team/page.tsx` - Owner creates a team
- `src/app/register/join-team/page.tsx` - Admin joins a team

Optional pages to add:
- `src/app/forgot-password/page.tsx` - Request password reset
- `src/app/reset-password/page.tsx` - Confirm password reset
- `src/app/verify-email/page.tsx` - Email verification

**Email Configuration:**
To enable email-based features (password reset, email verification), configure SMTP settings in your backend.

### API Structure

The API uses a class-based service pattern with a unified API client factory.

**API Client Pattern**:
- Single `createApi(token?)` factory handles both authenticated and public requests
- If token is undefined, auto-gets from localStorage
- If token is null, makes public request (for auth endpoints)
- All services extend `BaseApiService` for consistent error handling

**Service Usage**:
- **Buildings**: `buildingsApi.getAll()`, `buildingsApi.create()`, etc.
- **Rooms**: `roomsApi.getAll()`, `roomsApi.create()`, `roomsApi.bulkCreate()`, etc.
- **Tenants**: `tenantsApi.getAll()`, `tenantsApi.create()`, etc.
- **Readings**: `readingsApi.getAll()`, `readingsApi.create()`, etc.
- **Invoices**: `invoicesApi.getAll()`, `invoicesApi.update()`, etc.
- **Settings**: `settingsApi.get(teamId)`, `settingsApi.update(teamId, updates)`
- **Auth**: `authApi.login()`, `authApi.register()`, etc.

All API methods return data that matches the TypeScript interfaces defined in `lib/types.ts` and `lib/api/services/*-types.ts`.

**Error Handling**:
- All API errors are automatically transformed into typed `ApiError` instances
- Errors are logged in development mode
- Services use consistent error handling via `BaseApiService.handleError()`

## Environment Variables

**Required**:
- `VITE_API_URL` - Base URL for the API server (e.g., `http://localhost:3000`)

The app validates required environment variables on startup and will show warnings in development if they're missing.

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API server URL | `http://localhost:3000` |

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
