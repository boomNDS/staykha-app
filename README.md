# StayKha

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
- **Authentication**: Login functionality (registration and password reset can be added using PocketBase's built-in features)

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
- **PocketBase** - Backend-as-a-Service (BaaS) with built-in database, authentication, and file storage

### Development Tools
- **Biome** - Linting and formatting
- **pnpm** - Package manager

## Prerequisites

- **Node.js** 18+ and **pnpm** installed
- **PocketBase** instance running (see setup guide below)
  - **Option 1 (Recommended):** Docker and Docker Compose
  - **Option 2:** Manual PocketBase installation
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
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

4. Start the development server:
```bash
pnpm dev
```

5. Open your browser and navigate to `http://localhost:5173`

## PocketBase Setup Guide

StayKha uses PocketBase as its backend. For detailed setup instructions, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.

### Quick Start (Docker)

1. **Start PocketBase:**
   ```bash
   docker-compose up -d
   ```

2. **Access PocketBase Admin UI:**
   - Open http://localhost:8090/_/ in your browser
   - Create your admin account
   - Follow the detailed setup guide: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

3. **Verify it's running:**
   ```bash
   docker-compose ps
   curl http://localhost:8090/api/health
   ```

### Manual Installation

If you prefer to run PocketBase manually:

1. **Install PocketBase:**
   - **macOS**: `brew install pocketbase` or download from [releases](https://github.com/pocketbase/pocketbase/releases)
   - **Linux/Windows**: Download from [PocketBase Releases](https://github.com/pocketbase/pocketbase/releases/latest)

2. **Start PocketBase:**
   ```bash
   ./pocketbase serve
   ```

3. **Follow setup guide:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for collection configuration and setup steps.

### Collections Overview

The application requires the following PocketBase collections:
- `teams` - Organizations/companies that own buildings and settings
- `users` (with custom `role` and `teamId` fields)
- `buildings`
- `rooms`
- `tenants`
- `reading_groups`
- `invoices`
- `settings` (linked to teams via `teamId`)
- `admin_invitations`

**Access Control**: The application implements role-based and team-based access control:
- Only **owners** and **admins** can access data
- Users can only access data from their own team (`teamId = @request.auth.teamId`)
- **CRITICAL**: All collections (rooms, tenants, reading_groups, invoices) MUST have a `teamId` field to enforce team isolation at the database level
- Only **owners** can create/update/delete teams, buildings, and settings
- **Admins** can view and update (but not delete) rooms, tenants, readings, and invoices within their team
- Without `teamId` fields, admins from different teams could access each other's data

For detailed field definitions and access rules, see [SETUP_GUIDE.md](./SETUP_GUIDE.md) or [docs/pocketbase-er.md](./docs/pocketbase-er.md).

## Entity Relationship Diagram

```mermaid
erDiagram
    Team ||--o{ User : "has members"
    Team ||--o{ Building : "contains"
    Team ||--o{ Room : "contains"
    Team ||--o{ Tenant : "contains"
    Team ||--o{ ReadingGroup : "contains"
    Team ||--o{ Invoice : "contains"
    Team ||--|| Settings : "has settings"
    Team ||--o{ AdminInvitation : "has invitations"
    User ||--o{ Building : owns
    User ||--o{ AdminInvitation : creates
    Building ||--o{ Room : contains
    Room ||--o| Tenant : "has (0..1)"
    Room ||--o{ ReadingGroup : "has readings"
    ReadingGroup ||--o{ Invoice : "generates"
    Tenant ||--o{ Invoice : "receives"

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
        string role "owner|admin"
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
        string status "occupied|vacant|maintenance"
        number monthlyRent
        number size
        string tenantId FK "nullable"
        string teamId FK
    }

    Tenant {
        string id PK
        string name
        string email
        string phone
        string roomId FK
        date moveInDate
        date contractEndDate "nullable"
        number monthlyRent
        number deposit
        string idCardNumber "nullable"
        string emergencyContact "nullable"
        string emergencyPhone "nullable"
        string status "active|inactive|expired"
        string teamId FK
    }

    ReadingGroup {
        string id PK
        string roomId FK
        string roomNumber
        string tenantName
        date readingDate
        string status "incomplete|pending|billed|paid"
        json water "nullable"
        json electric "nullable"
        string teamId FK
    }

    Invoice {
        string id PK
        string invoiceNumber "nullable"
        string tenantId FK "nullable"
        string roomId FK
        string tenantName
        string roomNumber
        string billingPeriod
        date issueDate
        date dueDate
        string status "draft|sent|paid|pending|overdue"
        number waterUsage
        number waterRate
        number waterAmount
        number electricUsage
        number electricRate
        number electricAmount
        number subtotal
        number tax
        number total
        date paidDate "nullable"
        number waterConsumption "nullable"
        number electricConsumption "nullable"
        number waterRatePerUnit "nullable"
        number electricRatePerUnit "nullable"
        number waterSubtotal "nullable"
        number electricSubtotal "nullable"
        string waterBillingMode "metered|fixed" "nullable"
        number waterFixedFee "nullable"
        string readingGroupId FK "nullable"
        json readings "nullable"
        string teamId FK
    }

    Settings {
        string id PK
        string teamId FK
        number waterRatePerUnit
        string waterBillingMode "metered|fixed"
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
        string bankName "nullable"
        string bankAccountNumber "nullable"
        string lineId "nullable"
        number latePaymentPenaltyPerDay "nullable"
        number dueDateDayOfMonth "nullable"
        string labelInvoice "nullable"
        string labelRoomRent "nullable"
        string labelWater "nullable"
        string labelElectricity "nullable"
    }

    AdminInvitation {
        string id PK
        string email
        string teamId FK
        string invitedBy FK
        string invitedByName
        string status "pending|accepted|expired"
        string inviteCode
        date expiresAt
        json buildings "nullable"
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
│   ├── pocketbase-api.ts      # PocketBase API client
│   ├── api-client.ts          # API client exports
│   ├── types.ts               # TypeScript type definitions
│   ├── schemas.ts             # Zod validation schemas
│   ├── auth-context.tsx       # Authentication context
│   └── utils.ts               # Utility functions
├── docs/                      # Documentation
│   └── pocketbase-er.md       # PocketBase architecture docs
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

The application uses PocketBase as the backend. All API calls are made through the `lib/pocketbase-api.ts` client, which uses `ofetch` to communicate with PocketBase's REST API.

### Authentication

**Current Implementation:**
The application currently implements login functionality only. Users authenticate through PocketBase's built-in authentication system. The app stores the auth token in `localStorage` and includes it in API requests via the `Authorization` header.

**Available Authentication Features:**
PocketBase supports additional authentication features that can be implemented:

- ✅ **Login** - Currently implemented
- ⚠️ **User Registration** - Not yet implemented (can be added)
- ⚠️ **Password Reset / Forgot Password** - Not yet implemented (can be added)
- ⚠️ **Email Verification** - Not yet implemented (can be added)
- ⚠️ **Password Change** - Not yet implemented (can be added)

**Adding Registration, Password Reset, and Other Auth Features:**

To add these features, you can extend the `authApi` in `lib/pocketbase-api.ts`:

```typescript
// User Registration
register: async (email: string, password: string, passwordConfirm: string, name?: string) => {
  const response = await authClient.post("/records", {
    email,
    password,
    passwordConfirm,
    name,
    emailVisibility: false,
  })
  return response
}

// Request Password Reset
requestPasswordReset: async (email: string) => {
  return await authClient.post("/request-password-reset", { email })
}

// Confirm Password Reset
confirmPasswordReset: async (token: string, password: string, passwordConfirm: string) => {
  return await authClient.post("/confirm-password-reset", {
    token,
    password,
    passwordConfirm,
  })
}

// Verify Email
verifyEmail: async (token: string) => {
  return await authClient.post("/verify-email", { token })
}

// Change Password (requires authentication)
changePassword: async (oldPassword: string, password: string, passwordConfirm: string) => {
  return await authClient.post("/change-password", {
    oldPassword,
    password,
    passwordConfirm,
  })
}
```

Then create corresponding pages:
- `src/app/register/page.tsx` - User registration page
- `src/app/forgot-password/page.tsx` - Request password reset
- `src/app/reset-password/page.tsx` - Confirm password reset
- `src/app/verify-email/page.tsx` - Email verification

**PocketBase Email Configuration:**
To enable email-based features (password reset, email verification), configure SMTP settings in PocketBase admin panel:
1. Go to **Settings** → **Mail settings**
2. Configure your SMTP server (Gmail, SendGrid, etc.)
3. Set up email templates for password reset and verification

### API Structure

- **Buildings**: `buildingsApi.getAll()`, `buildingsApi.create()`, etc.
- **Rooms**: `roomsApi.getAll()`, `roomsApi.create()`, `roomsApi.bulkCreate()`, etc.
- **Tenants**: `tenantsApi.getAll()`, `tenantsApi.create()`, etc.
- **Readings**: `readingsApi.getAll()`, `readingsApi.create()`, etc.
- **Invoices**: `invoicesApi.getAll()`, `invoicesApi.update()`, etc.
- **Settings**: `settingsApi.get()`, `settingsApi.update()`
- **Auth**: `authApi.login()`

All API methods return data that matches the TypeScript interfaces defined in `lib/types.ts`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_POCKETBASE_URL` | PocketBase server URL | `http://127.0.0.1:8090` |

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
